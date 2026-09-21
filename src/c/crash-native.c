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
 *   (%b64-decode text) -> bytevector
 *     Standard base64 (with or without padding; whitespace skipped) to
 *     bytes. The page hands each tune over as base64 chunks through the
 *     dispatch (a string is the only payload the bridge carries), and a
 *     7.5 MB tune decoded a character at a time in Sigil took whole
 *     frames per 16 KB; here a 512 KB chunk is under a millisecond.
 *
 *   (%fatal!) -> never returns
 *     The page guard's trap door (?trap): a FATAL line on stderr and abort(),
 *     the runtime's own out-of-memory shape, so the browser arm can kill the
 *     instance on demand.
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

/* the VM's temporary roots (sigil-internal.h; sigil's own wasm packages
 * declare them the same way): a Value held in a C local across an
 * allocation is not a root otherwise */
extern void sigil__gc_push_temp_root(SigilVM *vm, Value v);
extern void sigil__gc_pop_temp_root(SigilVM *vm);
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#include <stdio.h>
/* The Windows build links as a GUI-subsystem program (the windows-amd64
 * config's link-flags: no console window beside the game from Explorer;
 * David, 2026-09-22), so it starts with no standard streams. From a
 * terminal, attach to the parent's console and point stdout/stderr at
 * it, so the diagnostics (crash: ..., sigil-desktop:, miniaudio) print
 * there as on Linux; from Explorer there is no parent console and this
 * does nothing. A console-subsystem build already owns a console and
 * AttachConsole fails harmlessly. */
/* A standard stream the process already has (a redirect such as
 * `crash-the-stack.exe > log.txt`, or an inherited handle) is kept;
 * only a missing one is pointed at the parent console. */
static int std_stream_present(DWORD which)
{
    HANDLE h = GetStdHandle(which);
    return h != NULL && h != INVALID_HANDLE_VALUE && GetFileType(h) != FILE_TYPE_UNKNOWN;
}

static void attach_parent_console(void)
{
    int out_ok = std_stream_present(STD_OUTPUT_HANDLE);
    int err_ok = std_stream_present(STD_ERROR_HANDLE);
    if (out_ok && err_ok) return;
    if (AttachConsole(ATTACH_PARENT_PROCESS)) {
        if (!out_ok && freopen("CONOUT$", "w", stdout)) setvbuf(stdout, NULL, _IONBF, 0);
        if (!err_ok && freopen("CONOUT$", "w", stderr)) setvbuf(stderr, NULL, _IONBF, 0);
    }
}
#endif

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
        while (pos >= (double)frames) pos -= (double)frames;   /* a ratio past the loop's length wraps twice */
    }
    return sigil_flonum(pos);
}


/* (%upsample! out out-offset n src have pos ratio) -> pos'
 *
 * The live soundtrack rendered below the device's rate (M1, D59: the
 * synth's cost scales with the rate; David's phone at 48 kHz spent 46 % of
 * real time in it). src holds `have` stereo f32 frames at the music's
 * rate; n stereo f32 frames at the device's rate are WRITTEN (not added)
 * to out from out-offset bytes, reading src from the fractional frame
 * `pos` on, `ratio` = music rate / device rate per output frame. A 4-tap
 * cubic Hermite over frames i-1..i+2 (linear lost the top end to David's
 * ear at 22050); the caller keeps one frame before pos and two past the
 * last read valid, and answers with the new pos (frames, fractional). */
static Value native_upsample(SigilVM *vm, int argc, Value *args)
{
    if (argc < 7 || !sigil_is_bytevector(args[0]) || !sigil_is_bytevector(args[3])) {
        sigil__vm_set_error(vm, SIGIL_ERR_TYPE, "%upsample!: expected (out offset n src have pos ratio)");
        return sigil_flonum(0.0);
    }
    float *out = (float *)sigil_bytevector_data(args[0]);
    size_t out_bytes = sigil_bytevector_length(args[0]);
    int64_t off = sigil_as_fixnum(args[1]);
    int64_t n = sigil_as_fixnum(args[2]);
    const float *src = (const float *)sigil_bytevector_data(args[3]);
    size_t src_bytes = sigil_bytevector_length(args[3]);
    int64_t have = sigil_as_fixnum(args[4]);
    double pos = sigil_as_flonum(args[5]);
    double ratio = sigil_as_flonum(args[6]);
    if (off < 0 || n < 0 || (size_t)off + (size_t)n * 2 * sizeof(float) > out_bytes) return sigil_flonum(pos);
    if (have < 4 || (size_t)have * 2 * sizeof(float) > src_bytes) return sigil_flonum(pos);
    out = (float *)((char *)out + off);
    for (int64_t k = 0; k < n; k++) {
        int64_t i = (int64_t)pos;
        double f = pos - (double)i;
        if (i < 1) { i = 1; f = 0.0; }
        if (i + 2 >= have) { i = have - 3; f = 1.0; }
        const float *p0 = src + 2 * (i - 1), *p1 = src + 2 * i, *p2 = src + 2 * (i + 1), *p3 = src + 2 * (i + 2);
        for (int c = 0; c < 2; c++) {
            double y0 = p0[c], y1 = p1[c], y2 = p2[c], y3 = p3[c];
            double a = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3;
            double b = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
            double cc = -0.5 * y0 + 0.5 * y2;
            out[2 * k + c] = (float)(((a * f + b) * f + cc) * f + y1);
        }
        pos += ratio;
    }
    return sigil_flonum(pos);
}

/* (%cpu-ms) -> flonum: this process's CPU time in milliseconds (the
 * bench's clock: a wall clock on a shared box measures the neighbours;
 * bench/bench-music.sgl). -1.0 where the clock is not there. */
static Value native_cpu_ms(SigilVM *vm, int argc, Value *args)
{
    (void)vm; (void)argc; (void)args;
#if defined(CLOCK_PROCESS_CPUTIME_ID)
    struct timespec ts;
    if (clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &ts) == 0)
        return sigil_flonum((double)ts.tv_sec * 1000.0 + (double)ts.tv_nsec / 1e6);
#endif
    return sigil_flonum(-1.0);
}
static Value native_b64_decode(SigilVM *vm, int argc, Value *args)
{
    if (argc < 1 || !sigil_is_string(args[0])) {
        sigil__vm_set_error(vm, SIGIL_ERR_TYPE, "%b64-decode: expected a string");
        return SIGIL_FALSE;
    }
    SigilString *text = (SigilString *)sigil_as_ptr(args[0]);
    const unsigned char *in = (const unsigned char *)text->data;
    size_t n = text->byte_length;
    /* the sextets in one pass: -1 for anything that is not a digit */
    static signed char table[256];
    static int ready = 0;
    if (!ready) {
        const char *digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for (int i = 0; i < 256; i++) table[i] = -1;
        for (int i = 0; i < 64; i++) table[(unsigned char)digits[i]] = (signed char)i;
        ready = 1;
    }
    size_t digits_n = 0;
    for (size_t i = 0; i < n; i++) if (table[in[i]] >= 0) digits_n++;
    size_t out_n = (digits_n / 4) * 3 + (digits_n % 4 == 3 ? 2 : digits_n % 4 == 2 ? 1 : 0);
    Value bv = sigil_make_bytevector(vm, out_n);
    unsigned char *out = (unsigned char *)sigil_bytevector_data(bv);
    unsigned int acc = 0;
    int bits = 0;
    size_t o = 0;
    for (size_t i = 0; i < n; i++) {
        signed char d = table[in[i]];
        if (d < 0) continue;
        acc = (acc << 6) | (unsigned int)d;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            if (o < out_n) out[o++] = (unsigned char)((acc >> bits) & 0xff);
        }
    }
    return bv;
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
    sigil__gc_push_temp_root(vm, bv);
    Value tail = sigil_cons(vm, bv, SIGIL_NIL);
    sigil__gc_push_temp_root(vm, tail);
    Value mid = sigil_cons(vm, sigil_fixnum(channels), tail);
    sigil__gc_push_temp_root(vm, mid);
    Value result = sigil_cons(vm, sigil_fixnum(rate), mid);
    sigil__gc_pop_temp_root(vm);
    sigil__gc_pop_temp_root(vm);
    sigil__gc_pop_temp_root(vm);
    return result;
#endif
}

/* (%fatal!) -> never returns
 *   The page guard's trap door (the web soak row, 2026-09-21): the same
 *   two steps the runtime's own out-of-memory path takes in
 *   gc-generational.c (a "FATAL: ..." line on stderr, then abort(), which
 *   is the wasm `unreachable` trap Trev's console showed), so the arm can
 *   kill the instance on demand and count the FATAL lines that follow: one
 *   means nothing dispatched into the dead instance after the guard fired.
 *   Reached only through the web shell's ("trap", ...) dispatch, which the
 *   page sends for ?trap; never on a player's page. */
static Value native_fatal(SigilVM *vm, int argc, Value *args)
{
    (void)vm; (void)argc; (void)args;
    fprintf(stderr, "FATAL: crash: the trap door fired (?trap)\n");
    fflush(stderr);
    abort();
    return SIGIL_FALSE;
}

void sigil__init_crash_native_module(SigilVM *vm)
{
#ifdef _WIN32
    attach_parent_console();
#endif
    SigilModule *module = sigil_begin_module(vm, "(crash native)");
    if (!module) return;
    sigil_module_register_native(vm, "%mix-track!", native_mix_track, SIGIL_ARITY_EXACT(8),
                                 "Add n frames of a looping s16 mono track into a stereo float buffer with a gain ramp");
    sigil_module_register_native(vm, "%decode-ogg", native_decode_ogg, SIGIL_ARITY_EXACT(1),
                                 "Decode an OGG Vorbis file to (rate channels s16-bytevector), or #f");
    sigil_module_register_native(vm, "%b64-decode", native_b64_decode, SIGIL_ARITY_EXACT(1),
                                 "Decode a base64 string to a bytevector");
    sigil_module_register_native(vm, "%fatal!", native_fatal, SIGIL_ARITY_EXACT(0),
                                 "The page guard's trap door: a FATAL line on stderr, then abort()");
    sigil_module_export(vm, "%mix-track!");
    sigil_module_export(vm, "%decode-ogg");
    sigil_module_export(vm, "%b64-decode");
    sigil_module_export(vm, "%fatal!");
    sigil_module_register_native(vm, "%upsample!", native_upsample, SIGIL_ARITY_EXACT(7),
                                 "Write n stereo f32 frames at the device rate from a lower-rate stereo f32 source, 4-tap cubic");
    sigil_module_export(vm, "%upsample!");
    sigil_module_register_native(vm, "%cpu-ms", native_cpu_ms, SIGIL_ARITY_EXACT(0),
                                 "This process's CPU time in ms, or -1.0");
    sigil_module_export(vm, "%cpu-ms");
    sigil_end_module(vm);
}
