/*
 * crash-native.c - The game's own natives (C on both targets).
 *
 *   (%b64-decode text) -> bytevector
 *     Standard base64 (with or without padding; whitespace skipped) to
 *     bytes. The page hands a tune's text over as base64 chunks through
 *     the dispatch (a string is the only payload the bridge carries); a
 *     decode a character at a time in Sigil took whole frames per 16 KB,
 *     here a chunk is under a millisecond.
 *
 *   (%upsample! out out-offset n src have pos ratio) -> pos'
 *     The live soundtrack rendered below the device rate, a 4-tap cubic
 *     into the device-rate buffer (M1, D59); see the function.
 *
 *   (%cpu-ms) -> flonum
 *     This process's CPU time in ms (the bench's clock); -1.0 where the
 *     clock is not there.
 *
 *   (%fatal!) -> never returns
 *     The page guard's trap door (?trap): a FATAL line on stderr and abort(),
 *     the runtime's own out-of-memory shape, so the browser arm can kill the
 *     instance on demand.
 *
 * P4's %mix-track! (the OGG tracks' inner loop) and %decode-ogg
 * (stb_vorbis) left with M1: the music plays live from .cts on motif's
 * player and nothing decoded ships. Both targets compile this file (zig
 * cc for wasm32-wasi too).
 */

#include "sigil/sigil.h"
#include <stdint.h>

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

/*
 * (%open-url url) -> #t or #f
 *   The platform's own "open this": ShellExecute on Windows, xdg-open on
 *   Linux and the BSDs, open on macOS; the NEWS menu's way of showing a
 *   news post outside the game (P4b, ruling D20). Native only: on the
 *   web the page opens the post itself (window.open) on the game's
 *   "crash: open URL" line, and this native answers #f. Only http(s) URLs
 *   are handed to the platform.
 */
static Value native_open_url(SigilVM *vm, int argc, Value *args)
{
#ifdef __wasm__
    (void)vm; (void)argc; (void)args;
    return SIGIL_FALSE;
#else
    if (argc < 1 || !sigil_is_string(args[0])) {
        sigil__vm_set_error(vm, SIGIL_ERR_TYPE, "%open-url: expected a URL string");
        return SIGIL_FALSE;
    }
    SigilString *url = (SigilString *)sigil_as_ptr(args[0]);
    const char *u = url->data;
    if (strncmp(u, "http://", 7) != 0 && strncmp(u, "https://", 8) != 0) return SIGIL_FALSE;
    for (const char *c = u; *c; c++) if (*c == '"' || *c == '\'' || *c == ' ' || *c < 0x20) return SIGIL_FALSE;
#ifdef _WIN32
    return ((intptr_t)ShellExecuteA(NULL, "open", u, NULL, NULL, SW_SHOWNORMAL) > 32) ? SIGIL_TRUE : SIGIL_FALSE;
#else
    char cmd[2048];
#ifdef __APPLE__
    int n = snprintf(cmd, sizeof cmd, "open '%s' >/dev/null 2>&1 &", u);
#else
    int n = snprintf(cmd, sizeof cmd, "xdg-open '%s' >/dev/null 2>&1 &", u);
#endif
    if (n <= 0 || (size_t)n >= sizeof cmd) return SIGIL_FALSE;
    return system(cmd) == 0 ? SIGIL_TRUE : SIGIL_FALSE;
#endif
#endif
}

void sigil__init_crash_native_module(SigilVM *vm)
{
#ifdef _WIN32
    attach_parent_console();
#endif
    SigilModule *module = sigil_begin_module(vm, "(crash native)");
    if (!module) return;
    sigil_module_register_native(vm, "%b64-decode", native_b64_decode, SIGIL_ARITY_EXACT(1),
                                 "Decode a base64 string to a bytevector");
    sigil_module_register_native(vm, "%fatal!", native_fatal, SIGIL_ARITY_EXACT(0),
                                 "The page guard's trap door: a FATAL line on stderr, then abort()");
    sigil_module_export(vm, "%b64-decode");
    sigil_module_register_native(vm, "%open-url", native_open_url, SIGIL_ARITY_EXACT(1),
                                 "Open an http(s) URL with the platform's own opener (native); #f on the web");
    sigil_module_export(vm, "%fatal!");
    sigil_module_export(vm, "%open-url");
    sigil_module_register_native(vm, "%upsample!", native_upsample, SIGIL_ARITY_EXACT(7),
                                 "Write n stereo f32 frames at the device rate from a lower-rate stereo f32 source, 4-tap cubic");
    sigil_module_export(vm, "%upsample!");
    sigil_module_register_native(vm, "%cpu-ms", native_cpu_ms, SIGIL_ARITY_EXACT(0),
                                 "This process's CPU time in ms, or -1.0");
    sigil_module_export(vm, "%cpu-ms");
    sigil_end_module(vm);
}
