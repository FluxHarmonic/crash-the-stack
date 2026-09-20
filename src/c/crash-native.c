/*
 * crash-native.c - The game's own natives: the music mixer's inner loop
 * and the OGG decoder (P4, ruling D50).
 *
 * The mixer in (crash audio) is Sigil; its per-sample loops cost 9 ms a
 * frame on the phone at 48 kHz (P3c), which is why the ambient was cached
 * as a rendered stereo float loop. A three-minute tune's cache would be
 * 65 MB, three of them 200 MB: instead the inner loop lives here, and a
 * track is kept as its decoded s16 mono PCM (7.5 MB for three minutes).
 *
 *   (%mix-track! out n src src-frames pos ratio gain0 gain1) -> flonum
 *     Adds n stereo float32 frames of src (s16le mono, src-frames long,
 *     looping) into out (stereo float32, n frames), reading from the
 *     fractional frame position pos and advancing ratio (src rate / out
 *     rate) per output frame, with the gain ramping linearly from gain0
 *     to gain1 over the n frames. Answers the position after the n frames
 *     (wrapped into the loop). Linear interpolation, as the Sigil mix did.
 *
 *   (%decode-ogg path) -> (rate channels bytevector) or #f
 *     The whole file decoded by stb_vorbis to s16le interleaved PCM.
 *     Native only: on the web the page decodes with decodeAudioData and
 *     hands the PCM over in chunks, so this native answers #f there.
 *
 * Both targets compile this file (zig cc for wasm32-wasi too); stb_vorbis
 * comes from sigil-audio's archive (its audio.c includes the implementation
 * with external linkage); the web build has no sigil-audio C, and the page
 * decodes there anyway.
 */

#include "sigil/sigil.h"
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#ifndef __wasm__
/* stb_vorbis is linked already: sigil-audio's audio.c includes the
 * implementation with external linkage (a second copy here clashed at
 * link time), so only the prototype is needed. */
extern int stb_vorbis_decode_filename(const char *filename, int *channels, int *sample_rate, short **output);

#endif

static Value native_mix_track(SigilVM *vm, int argc, Value *args)
{
    if (argc < 8 || !sigil_is_bytevector(args[0]) || !sigil_is_bytevector(args[2])) {
        sigil__vm_set_error(vm, SIGIL_ERR_TYPE,
                            "%mix-track!: out n src src-frames pos ratio gain0 gain1");
        return sigil_flonum(0.0);
    }
    float *out = (float *)sigil_bytevector_data(args[0]);
    size_t out_bytes = sigil_bytevector_length(args[0]);
    int64_t n = sigil_as_fixnum(args[1]);
    const int16_t *src = (const int16_t *)sigil_bytevector_data(args[2]);
    size_t src_bytes = sigil_bytevector_length(args[2]);
    int64_t frames = sigil_as_fixnum(args[3]);
    double pos = sigil_as_flonum(args[4]);
    double ratio = sigil_as_flonum(args[5]);
    double g0 = sigil_as_flonum(args[6]);
    double g1 = sigil_as_flonum(args[7]);

    if (n < 0) n = 0;
    if ((size_t)n * 2 * sizeof(float) > out_bytes) n = (int64_t)(out_bytes / (2 * sizeof(float)));
    if (frames < 1 || (size_t)frames * sizeof(int16_t) > src_bytes) return sigil_flonum(pos);
    if (pos < 0.0 || pos >= (double)frames) pos = 0.0;

    double step = n > 0 ? (g1 - g0) / (double)n : 0.0;
    double g = g0;
    for (int64_t i = 0; i < n; i++) {
        int64_t k = (int64_t)pos;
        double frac = pos - (double)k;
        int64_t k1 = k + 1; if (k1 >= frames) k1 = 0;
        double a = src[k] / 32768.0, b = src[k1] / 32768.0;
        float v = (float)(g * (a + frac * (b - a)));
        out[2 * i] += v;
        out[2 * i + 1] += v;
        g += step;
        pos += ratio;
        if (pos >= (double)frames) pos -= (double)frames;
    }
    return sigil_flonum(pos);
}

static Value native_decode_ogg(SigilVM *vm, int argc, Value *args)
{
#ifdef __wasm__
    (void)vm; (void)argc; (void)args;
    return SIGIL_FALSE;
#else
    if (argc < 1 || !sigil_is_string(args[0])) {
        sigil__vm_set_error(vm, SIGIL_ERR_TYPE, "%decode-ogg: expected a path");
        return SIGIL_FALSE;
    }
    SigilString *path = (SigilString *)sigil_as_ptr(args[0]);
    int channels = 0, rate = 0;
    short *samples = NULL;
    int frames = stb_vorbis_decode_filename(path->data, &channels, &rate, &samples);
    if (frames < 0 || !samples) return SIGIL_FALSE;
    size_t bytes = (size_t)frames * (size_t)channels * sizeof(short);
    Value bv = sigil_make_bytevector(vm, bytes);
    memcpy(sigil_bytevector_data(bv), samples, bytes);
    free(samples);
    Value result = sigil_cons(vm, sigil_fixnum(rate),
                              sigil_cons(vm, sigil_fixnum(channels),
                                         sigil_cons(vm, bv, SIGIL_NIL)));
    return result;
#endif
}

void sigil__init_crash_native_module(SigilVM *vm)
{
    SigilModule *module = sigil_begin_module(vm, "(crash native)");
    if (!module) return;
    sigil_module_register_native(vm, "%mix-track!", native_mix_track, SIGIL_ARITY_EXACT(8),
                                 "Add n frames of a looping s16 mono track into a stereo float buffer with a gain ramp");
    sigil_module_register_native(vm, "%decode-ogg", native_decode_ogg, SIGIL_ARITY_EXACT(1),
                                 "Decode an OGG Vorbis file to (rate channels s16-bytevector), or #f");
    sigil_module_export(vm, "%mix-track!");
    sigil_module_export(vm, "%decode-ogg");
    sigil_end_module(vm);
}
