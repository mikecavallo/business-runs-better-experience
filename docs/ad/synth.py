#!/usr/bin/env python3
"""
Music bed and sound effects for the 30-second video ad, synthesized from scratch
(numpy only, nothing licensed). Writes music.wav and sfx.wav at 44.1 kHz.

Cue times are video seconds and match scene.html. If the scene timing changes,
change the cues here too.

  python3 docs/ad/synth.py OUT_DIR
"""
import sys, os, wave
import numpy as np

SR, DUR = 44100, 30.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
OUT = sys.argv[1] if len(sys.argv) > 1 else "."


def tt(d):
    return np.arange(int(d * SR)) / SR


def add(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig * gain


def env(d, attack=0.003, tau=0.2):
    t = tt(d)
    return np.minimum(1, t / attack) * np.exp(-t / tau)


def onepole(x, cutoff):
    """Simple low-pass; cutoff may be an array (sweeps)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def hp(x):
    return np.diff(x, prepend=0)


def note(n):  # MIDI number to Hz
    return 440 * 2 ** ((n - 69) / 12)


# ---------------------------------------------------------------- sound effects
def ding():
    d = 0.9
    out = np.zeros(int(d * SR))
    for k, f in enumerate([1567.98, 2093.0]):
        t = tt(d - k * 0.09)
        s = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * env(d - k * 0.09, 0.002, 0.22)
        add(out, s, k * 0.09, 0.5)
    return out


def whoosh(d=0.5, lo=300, hi=5000, up=True):
    t = tt(d)
    n = rng.standard_normal(len(t))
    sweep = lo + (hi - lo) * (t / d if up else 1 - t / d) ** 1.5
    s = onepole(n, sweep)
    s = s - onepole(s, sweep * 0.25)
    return s * np.sin(np.pi * t / d) ** 2 * 1.6


def thud():
    d = 0.6
    t = tt(d)
    f = 40 + 60 * np.exp(-t / 0.05)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, 0.22)
    s += onepole(rng.standard_normal(len(t)), 600) * env(d, 0.001, 0.03) * 0.8
    return s


def buzz():
    d = 0.42
    t = tt(d)
    car = np.tanh(3 * np.sin(2 * np.pi * 165 * t))
    gate = ((t < 0.13) | ((t > 0.2) & (t < 0.33))).astype(float)
    gate = onepole(gate, 60)
    s = onepole(car * gate, 900) * 0.7
    p = np.sin(2 * np.pi * 880 * t) * env(d, 0.002, 0.04) * 0.4
    return s + p


def tap():
    d = 0.08
    t = tt(d)
    return hp(rng.standard_normal(len(t))) * env(d, 0.0005, 0.004) * 0.5 + np.sin(2 * np.pi * 1300 * t) * env(d, 0.001, 0.02) * 0.5


def sent():
    d = 0.25
    t = tt(d)
    f = 520 + 700 * np.minimum(1, t / 0.12)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.004, 0.08) * 0.7


def bell(freqs, gap=0.045, tau=0.5, d=1.4):
    out = np.zeros(int(d * SR))
    for k, f in enumerate(freqs):
        t = tt(d - k * gap)
        s = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.1)
        add(out, s * env(d - k * gap, 0.002, tau), k * gap, 0.35)
    return out


def impact():
    d = 1.6
    t = tt(d)
    f = 34 + 50 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.003, 0.5)
    air = hp(hp(rng.standard_normal(len(t)))) * env(d, 0.002, 0.35) * 0.35
    return sub * 0.9 + air


def ring():
    out = np.zeros(int(0.4 * SR))
    for k, m in enumerate([88, 84, 88, 84]):
        d = 0.16
        t = tt(d)
        f = note(m)
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.02)) * env(d, 0.002, 0.06)
        add(out, s, k * 0.07, 0.4)
    return out


sfx = np.zeros(N)
# scene 1: the lead that went cold
add(sfx, ding(), 0.12, 0.8)
add(sfx, whoosh(0.5, 4000, 200, up=False), 2.12, 0.35)   # time-lapse to the morning
add(sfx, ding(), 2.95, 0.8)
add(sfx, thud(), 3.75, 0.9)
add(sfx, whoosh(0.45), 4.5, 0.4)
# scene 2: the day piling up, one buzz per problem card
for at in [4.88, 6.62, 8.32, 10.04, 11.54]:
    add(sfx, buzz(), at, 0.55)
# scene 3: the fix
add(sfx, whoosh(0.4, 200, 6000), 13.05, 0.45)
add(sfx, impact(), 13.42, 0.9)
add(sfx, whoosh(0.4), 14.9, 0.3)
add(sfx, ding(), 15.38, 0.7)
add(sfx, sent(), 16.38, 0.6)
add(sfx, bell([note(84), note(88), note(91), note(96)]), 17.3, 0.8)
add(sfx, whoosh(0.35), 18.55, 0.3)
add(sfx, tap(), 19.3, 0.9)
for at in [19.62, 20.06]:
    add(sfx, ring(), at, 0.7)
    add(sfx, buzz(), at, 0.3)
add(sfx, whoosh(0.35), 20.65, 0.3)
for k in range(5):
    c = 21.05 + k * 0.27
    add(sfx, tap(), c, 0.5)
    add(sfx, whoosh(0.3, 800, 7000), c + 0.12, 0.22)
add(sfx, bell([note(79), note(84), note(88)], gap=0.06, tau=0.6), 22.55, 0.7)
# end card
add(sfx, whoosh(0.4, 300, 3000), 23.3, 0.3)
add(sfx, sent(), 25.11, 0.5)

# ---------------------------------------------------------------- music
music = np.zeros(N)
t_all = np.arange(N) / SR

# 0 to 13.3 s: tension. A low drone and a clock that won't stop ticking.
tens = (t_all < 13.45)
drone = (np.sin(2 * np.pi * 55 * t_all) * 0.5 + np.sin(2 * np.pi * 82.41 * t_all) * 0.3 + np.sin(2 * np.pi * 116.54 * t_all) * 0.08)
lfo = 0.7 + 0.3 * np.sin(2 * np.pi * 0.25 * t_all)
swell = np.clip(t_all / 1.2, 0, 1) * (1 - np.clip((t_all - 12.9) / 0.5, 0, 1))
music += drone * lfo * swell * tens * 0.35
for k, at in enumerate(np.arange(0.0, 13.2, 0.5)):
    d = 0.05
    tk = tt(d)
    f = 2400 if k % 2 == 0 else 1800
    click = np.sin(2 * np.pi * f * tk) * env(d, 0.0005, 0.008) + hp(rng.standard_normal(len(tk))) * env(d, 0.0003, 0.003) * 0.4
    add(music, click, at, 0.18 + 0.12 * (at > 4.8))
# riser into the reveal
rd = 1.2
rt = tt(rd)
riser = onepole(rng.standard_normal(len(rt)), 300 + 7000 * (rt / rd) ** 2) * (rt / rd) ** 2
riser += np.sin(2 * np.pi * np.cumsum(200 + 500 * (rt / rd) ** 2) / SR) * (rt / rd) ** 2 * 0.25
add(music, riser, 13.42 - rd, 0.5)

# 13.42 s on: the groove, 104 BPM, C - G - Am - F
BPM = 104
beat = 60 / BPM
bar = 4 * beat
start = 13.42
chords = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]]
end_at = start + len(chords) * bar  # final chord lands here


def kick():
    d = 0.35
    t = tt(d)
    f = 48 + 110 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.001, 0.16)


def clap():
    d = 0.25
    t = tt(d)
    n = rng.standard_normal(len(t))
    bp = hp(onepole(n, 2500))
    e = env(d, 0.001, 0.08) + 0.6 * ((t > 0.012) & (t < 0.02))
    return bp * e * 0.9


def hat():
    d = 0.06
    t = tt(d)
    return hp(hp(rng.standard_normal(len(t)))) * env(d, 0.0005, 0.018) * 0.25


def pluck(m, d=0.4):
    t = tt(d)
    f = note(m)
    s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.05) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.03)
    return s * env(d, 0.002, 0.15)


def pad(ms, d):
    t = tt(d)
    s = np.zeros(len(t))
    for m in ms:
        for det in (-0.12, 0.12):
            f = note(m + 12) * 2 ** (det / 12)
            for h in range(1, 7):
                s += np.sin(2 * np.pi * f * h * t + h) / (h * h)
    a = np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.4)
    return s * a / len(ms)


def bass(m, d):
    t = tt(d)
    f = note(m - 12)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * env(d, 0.004, 0.35)


for b, ch in enumerate(chords):
    t0 = start + b * bar
    add(music, pad(ch, bar + 0.1), t0, 0.12)
    for i in range(4):
        bt = t0 + i * beat
        add(music, kick(), bt, 0.6 if b > 0 or i > 0 else 0.0)
        add(music, bass(ch[0], beat * 0.95), bt, 0.32)
        if i in (1, 3):
            add(music, clap(), bt, 0.28)
        add(music, hat(), bt + beat / 2, 1.0)
    arp = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[0] + 36, ch[2] + 24, ch[1] + 24, ch[2] + 24, ch[1] + 24]
    for i, m in enumerate(arp):
        add(music, pluck(m), t0 + i * beat / 2, 0.16)
# the last chord rings out under the end card
add(music, pad([48, 52, 55, 60], DUR - end_at), end_at, 0.14)
add(music, kick(), end_at, 0.6)
add(music, bass(48, 2.5), end_at, 0.3)
add(music, bell([note(72), note(76), note(79), note(84)], gap=0.08, tau=0.9, d=2.5), end_at, 0.5)
add(music, hp(hp(rng.standard_normal(int(2.0 * SR)))) * env(2.0, 0.002, 0.6) * 0.12, end_at)

# fade the very end
fade = np.clip((DUR - t_all) / 1.2, 0, 1)
music *= fade


def write(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    pcm = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", os.path.join(OUT, name))


write("music.wav", music)
write("sfx.wav", sfx)
