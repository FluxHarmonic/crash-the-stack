#!/usr/bin/env python3
"""INTERCEPT drift gate: line the captured output up against an offline render.

Inputs:
  capture.pcm   s16le stereo 48 kHz from worker-null.monitor (parec), started at
                CAPTURE_START_MS (epoch ms, from `date +%s%3N` just before parec)
  ref.wav       `motif tune render SONG.cts -r 48000`: sample 0 is song time 0
  game.log      the game's stdout: `crash: intercept clock NOW error E audio A wall W`

Method: for reference windows (1.5 s every 5 s of song time), find the lag in
the capture by normalised cross-correlation of the band-limited envelope, then
refine at sample level on the raw signal. Each window gives
capture_sample(T) = offset + slope * T. The slope measures drift between what
the device played and song time (1.0 exactly means no drift); the residuals
are the per-window error.

Then the absolute check: the capture maps song time T to epoch wall time
  heard(T) = CAPTURE_START_MS + capture_sample(T) / 48
and the game's clock lines claim the audio clock read A at wall W. The
difference W - heard(A) is how far the game's audio clock sits from the sound
arriving at the null sink's monitor, INCLUDING parec's own start-up and
buffering latency, which this method cannot separate (stated, not hidden).
"""
import sys, wave, re, json
import numpy as np

RATE = 48000

def load_capture(path):
    raw = np.fromfile(path, dtype='<i2').astype(np.float32) / 32768.0
    raw = raw[: len(raw) // 2 * 2].reshape(-1, 2)
    return raw.mean(axis=1)

def load_wav(path):
    with wave.open(path, 'rb') as w:
        n = w.getnframes(); ch = w.getnchannels(); sw = w.getsampwidth(); sr = w.getframerate()
        data = w.readframes(n)
    assert sr == RATE, f"reference rate {sr} != {RATE}"
    if sw == 2:
        a = np.frombuffer(data, dtype='<i2').astype(np.float32) / 32768.0
    elif sw == 4:
        a = np.frombuffer(data, dtype='<f4').astype(np.float32)
    else:
        raise SystemExit(f"unsupported sample width {sw}")
    return a.reshape(-1, ch).mean(axis=1)

def xcorr_lag(a, b):
    """lag L maximising sum a[i+L]*b[i] (a longer than b), via FFT."""
    n = len(a) + len(b)
    nfft = 1 << (n - 1).bit_length()
    fa = np.fft.rfft(a, nfft); fb = np.fft.rfft(b[::-1], nfft)
    c = np.fft.irfft(fa * fb, nfft)[len(b) - 1: len(a)]
    return int(np.argmax(c)), float(np.max(c))

def main():
    cap_path, ref_path, log_path, start_ms = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
    cap = load_capture(cap_path)
    ref = load_wav(ref_path)
    print(f"capture {len(cap)/RATE:.1f} s, reference {len(ref)/RATE:.1f} s, capture rms {np.sqrt(np.mean(cap**2)):.4f}")
    if np.sqrt(np.mean(cap ** 2)) < 1e-4:
        print("SETUP-FAILED: the capture is silent"); sys.exit(125)

    # coarse: the first 20 s of the song against the first 60 s of the capture, on decimated envelopes
    dec = 48
    env = lambda x: np.abs(x)[: len(x) // dec * dec].reshape(-1, dec).mean(axis=1)
    ce, re_ = env(cap[: 60 * RATE]), env(ref[5 * RATE: 25 * RATE])
    lag_d, _ = xcorr_lag(ce - ce.mean(), re_ - re_.mean())
    coarse = lag_d * dec - 5 * RATE   # capture sample of song sample 0
    print(f"coarse: song 0 at capture sample {coarse} ({coarse / RATE:.3f} s)")

    # Each window searches +-250 ms around the lag the previous correlated
    # window found (tracking), so a steady drift is followed instead of
    # leaving the search range: a song playing 1% slow gains 300 ms in 30 s.
    rows = []
    win = int(1.5 * RATE); search = int(0.25 * RATE)
    T = 5.0
    track = coarse
    while (T + 1.5) * RATE < len(ref):
        r0 = int(T * RATE)
        c0 = track + r0 - search
        if c0 < 0 or c0 + win + 2 * search > len(cap):
            T += 5.0; continue
        seg_r = ref[r0: r0 + win]
        seg_c = cap[c0: c0 + win + 2 * search]
        if np.sqrt(np.mean(seg_r ** 2)) < 1e-3:
            T += 5.0; continue
        # match amplitude envelopes (rectified, 16-sample means: 3 kHz), which
        # survive a pitch shift or a small stretch; lags are then in 1/3 ms steps
        E = 16
        ev = lambda x: (np.abs(x)[: len(x) // E * E].reshape(-1, E).mean(axis=1))
        er, ec = ev(seg_r), ev(seg_c)
        er = er - er.mean()
        lag_e, peak = xcorr_lag(ec - ec.mean(), er)
        ecw = ec[lag_e: lag_e + len(er)]; ecw = ecw - ecw.mean()
        norm = peak / (np.linalg.norm(er) * np.linalg.norm(ecw) + 1e-12)
        lag = lag_e * E
        rows.append((T, c0 + lag - r0, norm))
        if norm > 0.5:
            track = c0 + lag - r0
        T += 5.0
    good = [(t, o) for t, o, n in rows if n > 0.5]
    print(f"windows {len(rows)}, correlated above 0.5: {len(good)}")
    if len(good) < 10:
        print("SETUP-FAILED: too few windows correlate (is it the same song?)")
        for r in rows[:12]: print("  ", r)
        sys.exit(125)
    t = np.array([g[0] for g in good]); o = np.array([g[1] for g in good], dtype=float)
    slope, icpt = np.polyfit(t, o, 1)   # samples of offset per second of song
    resid = o - (slope * t + icpt)
    drift_ms_per_min = slope / RATE * 1000.0 * 60.0
    print(f"offset of song 0 in the capture: {icpt / RATE * 1000:.2f} ms; drift {drift_ms_per_min:+.3f} ms per minute of song")
    print(f"per-window residual: max |{np.max(np.abs(resid)) / RATE * 1000:.3f}| ms, sd {np.std(resid) / RATE * 1000:.3f} ms")
    spread = (o.max() - o.min()) / RATE * 1000
    print(f"capture offset spread over the song: {spread:.3f} ms")

    # the game's clock lines against the capture
    lines = [l for l in open(log_path, errors='replace') if 'intercept clock' in l]
    diffs, errs = [], []
    for l in lines:
        m = re.search(r'intercept clock (-?\d+) error (\S+) audio (\S+) wall (\d+)', l)
        if not m: continue
        now, err, aud, wall = int(m.group(1)), m.group(2), m.group(3), int(m.group(4))
        if err != '-': errs.append(float(err))
        if aud == '-' or float(aud) < 1000: continue
        a = float(aud)
        heard_wall = start_ms + (icpt + slope * a / 1000.0 + a / 1000.0 * RATE) / RATE * 1000.0
        diffs.append(wall - heard_wall)
    if errs:
        e = np.array(errs)
        print(f"drawn clock vs audio clock (audio - drawn), {len(e)} lines: median {np.median(e):+.1f} ms, max |{np.max(np.abs(e)):.0f}| ms, p95 |{np.percentile(np.abs(e), 95):.0f}| ms")
    if diffs:
        d = np.array(diffs)
        print(f"audio clock vs sound at the monitor (game wall - capture wall, incl. parec latency), {len(d)} lines: median {np.median(d):+.1f} ms, sd {np.std(d):.1f} ms, first {d[0]:+.1f} last {d[-1]:+.1f}")
    print(json.dumps({"drift_ms_per_min": drift_ms_per_min, "resid_max_ms": float(np.max(np.abs(resid)) / RATE * 1000),
                      "clock_err_median": float(np.median(errs)) if errs else None,
                      "abs_median_ms": float(np.median(diffs)) if diffs else None}))
    # The verdict. The first and last differences are each a median of five
    # lines, so one noisy line cannot decide it.
    if len(diffs) < 20:
        print(f"SETUP-FAILED: only {len(diffs)} clock lines with an audio reading"); sys.exit(125)
    d = np.array(diffs)
    head, tail = float(np.median(d[:5])), float(np.median(d[-5:]))
    reasons = []
    if len(good) < 30: reasons.append(f"only {len(good)} windows correlate (30 needed)")
    if abs(np.median(d)) > 30: reasons.append(f"the audio clock sits {np.median(d):+.1f} ms from the sound (30 allowed)")
    if abs(tail - head) >= 15: reasons.append(f"the audio clock moved {tail - head:+.1f} ms against the sound over the song (15 allowed)")
    if reasons:
        print("FAIL: " + "; ".join(reasons)); sys.exit(1)
    print(f"PASS: audio clock {np.median(d):+.1f} ms from the sound, {tail - head:+.1f} ms of movement first to last, {len(good)} windows")

main()
