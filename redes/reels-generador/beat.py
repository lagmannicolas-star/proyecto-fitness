"""Generates an original royalty-free energetic beat (kick, clap, hats, bass, chord stabs) as WAV."""
import sys, numpy as np, wave

SR = 44100
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 60.0
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
bpm = 124
rng = np.random.default_rng(seed)
beat = 60 / bpm
N = int(SR * dur)
out = np.zeros(N)

def add(sig, t):
    i = int(t * SR)
    if i >= N: return
    e = min(N, i + len(sig)); out[i:e] += sig[: e - i]

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12) * 0.9

def clap():
    n = int(0.2 * SR)
    s = rng.standard_normal(n) * env(n, 0.001, 0.05)
    # crude bandpass via diff
    return np.diff(np.concatenate([[0], s])) * 0.35

def hat(open_=False):
    n = int((0.15 if open_ else 0.05) * SR)
    s = rng.standard_normal(n)
    s = np.diff(np.concatenate([[0], s]))
    return s * env(n, 0.0005, 0.06 if open_ else 0.015) * 0.12

def saw(f, n):
    t = np.arange(n) / SR
    return 2 * ((t * f) % 1) - 1

def bass(f, length):
    n = int(length * SR)
    s = saw(f, n) * 0.5 + np.sin(2 * np.pi * f * np.arange(n) / SR)
    return np.tanh(s * 1.5) * env(n, 0.003, length * 0.6) * 0.28

def stab(freqs, length=0.18):
    n = int(length * SR)
    s = sum(saw(f, n) + saw(f * 1.006, n) for f in freqs)
    return s * env(n, 0.002, 0.08) * 0.05

# A minor progression: Am F C G
roots = [55.0, 43.65, 65.41, 49.0]
chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]
bar = 4 * beat
nbars = int(dur / bar) + 1
for b in range(nbars):
    t0 = b * bar
    ci = b % 4
    intro = b < 1
    for k in range(4):
        tb = t0 + k * beat
        if not intro: add(kick(), tb)
        if k in (1, 3) and not intro: add(clap(), tb)
        add(hat(), tb + beat / 2)
        add(hat(), tb + beat / 4 * 3) if b % 2 else None
        add(hat(True), tb + beat / 2) if k == 3 else None
        # offbeat bass
        if not intro:
            add(bass(roots[ci], beat / 2 * 0.9), tb + beat / 2)
    for k in (0, 1.5, 3):
        add(stab(chords[ci]), t0 + k * beat)
    # riser every 8 bars
    if b % 8 == 7:
        n = int(bar * SR); t = np.arange(n) / SR
        add(rng.standard_normal(n) * (t / bar) ** 2 * 0.08, t0)

# fade out last 2 s
fo = int(2 * SR); out[-fo:] *= np.linspace(1, 0, fo)
out = np.tanh(out * 1.2)
out /= np.max(np.abs(out)) + 1e-9
out *= 0.8
pcm = (out * 32767).astype(np.int16)
st = np.repeat(pcm[:, None], 2, axis=1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
