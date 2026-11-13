#!/usr/bin/env python3
"""
Music and sound effects for the 60-second "Meet Ray" video, synthesized from scratch
(numpy only, nothing licensed). Writes music.wav (stereo) and sfx.wav (mono), 44.1 kHz.

Cue times are video seconds and follow scene.html; word-synced cues are read from
timeline.json and segments.json, so they move with the voiceover.

  python3 docs/video/synth.py OUT_DIR
"""
import sys, os, wave, json
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "timeline.json")))
SEG = json.load(open(os.path.join(HERE, "segments.json")))
S = lambda i: TL["starts"][i]
wt = lambda i, k: S(i) + SEG[i]["words"][k][1]

SR, DUR = 44100, float(TL["duration"])
N = int(SR * DUR)
rng = np.random.default_rng(7)
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
HIT = 26.35                                   # the logo lands; the groove starts
CUT = {"B": 7.3, "C": 12.05, "D": 15.35, "E": 18.55, "F": 22.45, "G": 27.6, "H": 31.75, "I": 36.95, "J": 41.95, "K": 46.1, "L": 51.0}


def tt(d):
    return np.arange(int(d * SR)) / SR


def add(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf) or i < 0:
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig * gain


def env(d, attack=0.003, tau=0.2):
    t = tt(d)
    return np.minimum(1, t / attack) * np.exp(-t / tau)


def onepole(x, cutoff):
    """Simple low-pass; cutoff may be an array (sweeps). Short sounds only: it loops."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def filt(x, lo=None, hi=None, order=2):
    """Fixed band filter in the frequency domain (fast, any length)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = np.ones_like(f)
    if hi:
        H /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        H *= 1 - 1 / np.sqrt(1 + (f / lo) ** (2 * order))
    return np.fft.irfft(X * H, len(x))


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


def thud(tau=0.22):
    d = 0.7
    t = tt(d)
    f = 40 + 60 * np.exp(-t / 0.05)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, tau)
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
    d = 2.2
    t = tt(d)
    f = 32 + 56 * np.exp(-t / 0.09)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.003, 0.6)
    air = hp(hp(rng.standard_normal(len(t)))) * env(d, 0.002, 0.4) * 0.35
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


def knock():
    """Hammer on a roof: a woody knock with a little ring."""
    d = 0.22
    t = tt(d)
    s = np.sin(2 * np.pi * 410 * t) * env(d, 0.0008, 0.022) + 0.6 * np.sin(2 * np.pi * 1180 * t) * env(d, 0.0005, 0.012)
    s += 0.5 * np.sin(2 * np.pi * (70 + 60 * np.exp(-t / 0.02)) * t) * env(d, 0.001, 0.05)
    s += onepole(rng.standard_normal(len(t)), 3000) * env(d, 0.0004, 0.006) * 0.9
    return s


def dropped():
    """The call gives up: three falling beeps."""
    out = np.zeros(int(0.6 * SR))
    for k, f in enumerate([620, 520, 415]):
        t = tt(0.13)
        add(out, np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.005) * np.minimum(1, (0.13 - t) / 0.02), k * 0.16, 0.5)
    return out


def womp():
    """A sagging 'wah' for the money that vanished."""
    d = 0.8
    t = tt(d)
    f = 196 * 2 ** (-t / d * 0.9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(h * ph) / h for h in range(1, 9))
    return onepole(s, 1400 - 1000 * t / d) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.25) * 0.6


def tick(f=2400):
    d = 0.05
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * env(d, 0.0005, 0.008) + hp(rng.standard_normal(len(t))) * env(d, 0.0003, 0.003) * 0.4


sfx = np.zeros(N)
W_CUT, W_UP, W_DOWN, W_SOFT = whoosh(0.45), whoosh(0.4, 200, 6000), whoosh(0.5, 4000, 200, up=False), whoosh(0.35)
BOOK = bell([note(84), note(88), note(91), note(96)])
SOFT = bell([note(79), note(84), note(88)], gap=0.06, tau=0.6)

# A: Ray at work, then swamped
for k in range(1, 7):
    add(sfx, knock(), k * 0.55 - 0.02, 0.5)
for i in range(6):
    add(sfx, buzz(), S(1) + 0.25 + i * 0.42, 0.42)
add(sfx, thud(), wt(1, 6), 0.6)
add(sfx, thud(), wt(1, 8), 0.85)
# B: the call he can't take
add(sfx, W_CUT, CUT["B"] - 0.12, 0.4)
miss, job = wt(2, 8) - 0.05, wt(2, 10) - 0.05
at = CUT["B"] + 0.25
while at < miss - 0.5:
    add(sfx, ring(), at, 0.75); add(sfx, ring(), at + 0.3, 0.75); add(sfx, buzz(), at, 0.3)
    at += 0.9
add(sfx, dropped(), miss - 0.02, 0.6)
add(sfx, thud(), miss, 0.7)
for i in (1, 2):
    add(sfx, tap(), miss + i * 0.24, 0.8)
add(sfx, thud(), job, 0.9)
add(sfx, impact(), job + 0.14, 0.75)
# C: buried on page four
add(sfx, W_CUT, CUT["C"] - 0.12, 0.4)
land = wt(3, 5)
add(sfx, whoosh(land - 12.2, 5000, 250, up=False), 12.3, 0.4)
add(sfx, thud(), land + 0.05, 0.95)
# D: the ad money
add(sfx, W_CUT, CUT["D"] - 0.12, 0.4)
add(sfx, thud(), CUT["D"] + 0.1, 0.6)
for k in range(14):
    add(sfx, tick(3000 + 90 * k), CUT["D"] + 0.2 + k * 0.085, 0.3)
nc = wt(4, 7) - 0.05
add(sfx, thud(), nc, 0.9)
add(sfx, womp(), nc + 0.05, 0.55)
# E: ten at night
add(sfx, W_DOWN, CUT["E"] - 0.2, 0.35)
add(sfx, thud(0.3), wt(5, 6) - 0.05, 0.6)
# F: the turn
add(sfx, W_DOWN, CUT["F"] - 0.25, 0.3)
add(sfx, W_UP, HIT - 0.38, 0.5)
add(sfx, impact(), HIT, 1.0)
add(sfx, bell([note(72), note(76), note(79), note(84)], gap=0.07, tau=0.9, d=2.4), HIT + 0.46, 0.5)
# G: the website
add(sfx, W_CUT, CUT["G"] - 0.1, 0.35)
found, click = wt(7, 5), wt(7, 9) - 0.1
for k in range(3):
    add(sfx, tap(), found - 0.15 + 0.125 * (k + 1), 0.7)
add(sfx, SOFT, found + 0.24, 0.6)
add(sfx, tap(), click, 0.9)
for at in (click + 0.22, click + 0.72):
    add(sfx, ring(), at, 0.6); add(sfx, buzz(), at, 0.22)
# H: the receptionist
add(sfx, W_SOFT, CUT["H"] - 0.1, 0.35)
add(sfx, sent(), wt(8, 2), 0.35); add(sfx, sent(), wt(8, 5), 0.45); add(sfx, sent(), wt(8, 8) + 0.15, 0.35)
for i in range(3):
    add(sfx, tap(), wt(8, 7) + 0.15 + i * 0.3, 0.6)
add(sfx, BOOK, wt(8, 10) - 0.1, 0.75)
# I: the 9:47 PM lead
add(sfx, W_SOFT, CUT["I"] - 0.1, 0.35)
add(sfx, ding(), CUT["I"] + 0.55, 0.65)
add(sfx, sent(), wt(9, 6) + 0.15, 0.6)
add(sfx, ding(), wt(9, 8), 0.4)
add(sfx, sent(), wt(9, 10) + 0.1, 0.5)
add(sfx, BOOK, wt(9, 10) + 0.5, 0.7)
# J: the dashboard
add(sfx, W_SOFT, CUT["J"] - 0.1, 0.35)
for k in range(16):
    add(sfx, tick(2600 + 60 * k), CUT["J"] + 0.55 + k * 0.06, 0.22)
add(sfx, whoosh(1.2, 400, 4000), CUT["J"] + 1.15, 0.18)
add(sfx, SOFT, wt(10, 6) - 0.1, 0.7)
# K: home for dinner
add(sfx, W_DOWN, CUT["K"] - 0.2, 0.3)
add(sfx, thud(0.3), wt(11, 11) - 0.05, 0.5)
add(sfx, SOFT, wt(11, 11) + 0.5, 0.6)
# L: end card
add(sfx, W_UP, CUT["L"] - 0.3, 0.35)
add(sfx, sent(), wt(12, 10) - 0.15, 0.5)
add(sfx, thud(0.3), wt(12, 10) - 0.15, 0.45)

# ---------------------------------------------------------------- music
dry = np.zeros(N)      # drums and bass, straight down the middle
wet = np.zeros(N)      # everything that gets reverb
t_all = np.arange(N) / SR


def pizz(m, d=0.5, tau=0.11):
    t = tt(d)
    f = note(m)
    s = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t * h * 3.5) / h for h in range(1, 7))
    return s * env(d, 0.002, tau)


def keys(m, d=3.0, tau=0.9):
    t = tt(d)
    f = note(m)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.3) + 0.15 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.12)
    return s * env(d, 0.004, tau)


def kick():
    d = 0.35
    t = tt(d)
    f = 48 + 110 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.001, 0.16)


def clap():
    d = 0.25
    t = tt(d)
    n = rng.standard_normal(len(t))
    bp = hp(filt(n, hi=2500, order=1))
    e = env(d, 0.001, 0.08) + 0.6 * ((t > 0.012) & (t < 0.02))
    return bp * e * 0.9


def hat(tau=0.018):
    d = 0.09
    t = tt(d)
    return hp(hp(rng.standard_normal(len(t)))) * env(d, 0.0005, tau) * 0.25


def pluck(m, d=0.4):
    t = tt(d)
    f = note(m)
    s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.05) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.03)
    return s * env(d, 0.002, 0.15)


def pad(ms, d, attack=0.35):
    t = tt(d)
    s = np.zeros(len(t))
    for m in ms:
        for det in (-0.12, 0.12):
            f = note(m + 12) * 2 ** (det / 12)
            for h in range(1, 7):
                s += np.sin(2 * np.pi * f * h * t + h) / (h * h)
    a = np.minimum(1, t / attack) * np.minimum(1, (d - t) / 0.4)
    return s * a / len(ms)


def bass(m, d):
    t = tt(d)
    f = note(m - 12)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * env(d, 0.004, 0.35)


# ---- 0 to 3.5 s: Ray at work. Bright, plucky, a little proud of himself.
B1 = 0.55                                     # one hammer swing per beat
add(wet, pad([48, 52, 55], 3.7), 0.0, 0.07)
for k, m in enumerate([76, 79, 84, 79, 76, 79, 86, 84, 79, 84, 88, 84]):
    add(wet, pizz(m), k * B1 / 2, 0.2)
for k in range(7):
    add(dry, pizz([36, 43][k % 2], 0.5, 0.16), k * B1, 0.3)

# ---- 3.5 to 18.55 s: the business runs him. A minor, a clock that won't stop, more piling on each scene.
T0, BT = 3.5, 0.6
ost = [45, 45, 48, 45, 52, 45, 48, 47]
k = 0
at = T0
while at < CUT["E"] - 0.05:
    lvl = 0.26 + 0.14 * min(1, (at - T0) / 12)
    add(dry, pizz(ost[k % 8], 0.5, 0.13), at, lvl)
    add(dry, tick(2400 if k % 2 == 0 else 1800), at, 0.16 + 0.1 * (at > CUT["B"]))
    if at > CUT["B"] and k % 2 == 1:           # offbeat stabs
        for m in (57, 60, 64):
            add(wet, pizz(m, 0.4, 0.07), at, 0.09)
    if at > CUT["C"]:                          # sixteenths
        add(dry, tick(3200), at + BT / 4, 0.09)
    if at > CUT["D"] and k % 2 == 0:           # a line that keeps climbing
        add(wet, pizz(76 + int((at - CUT["D"]) / BT), 0.4, 0.09), at, 0.16)
    k += 1
    at = T0 + k * BT / 2
drone = np.sin(2 * np.pi * 55 * t_all) * 0.5 + np.sin(2 * np.pi * 82.41 * t_all) * 0.3 + np.sin(2 * np.pi * 116.54 * t_all) * 0.08
lfo = 0.7 + 0.3 * np.sin(2 * np.pi * 0.25 * t_all)
swell = np.clip((t_all - 3.3) / 6, 0, 1) * (1 - np.clip((t_all - (HIT - 0.12)) / 0.1, 0, 1))
dry += drone * lfo * swell * 0.3

# ---- 18.55 to 22.45 s: ten at night. Just the clock and a few tired notes.
for k, at in enumerate(np.arange(CUT["E"] + 0.15, CUT["F"], 0.6)):
    add(wet, tick(2000 if k % 2 == 0 else 1600), at, 0.2)
for m, at in ((69, 18.75), (64, 19.95), (60, 21.05), (57, 22.0)):
    add(wet, keys(m), at, 0.3)

# ---- 22.45 to 26.35 s: the turn. A heartbeat, then the riser.
for at in (22.6, 23.55, 24.5, 25.25, 25.8):
    add(dry, kick(), at, 0.5); add(dry, kick(), at + 0.2, 0.3)
rd = 1.5
rt = tt(rd)
riser = onepole(rng.standard_normal(len(rt)), 300 + 7000 * (rt / rd) ** 2) * (rt / rd) ** 2
riser += np.sin(2 * np.pi * np.cumsum(200 + 500 * (rt / rd) ** 2) / SR) * (rt / rd) ** 2 * 0.25
add(wet, riser, HIT - rd - 0.06, 0.5)

# ---- 26.35 s on: the groove, 110 BPM. C G Am F, a breakdown for dinner, then home.
BPM = 110
beat = 60 / BPM
bar = 4 * beat
CH = {"C": [48, 52, 55], "G": [43, 47, 50], "Am": [45, 48, 52], "F": [41, 45, 48]}
bars = ["C", "G", "Am", "F", "C", "G", "Am", "F", "C", "Am", "F", "C", "G", "F"]
QUIET = (9, 10)                               # bars with no drums: Ray is home
HOOK = {"C": [(0, 79), (2, 76)], "G": [(0, 74), (2, 71)], "Am": [(0, 72), (2, 76)], "F": [(0, 77), (2, 81), (3, 79)]}
end_at = HIT + len(bars) * bar                # final chord lands here
for b, name in enumerate(bars):
    ch = CH[name]
    t0 = HIT + b * bar
    quiet = b in QUIET
    add(wet, pad(ch, bar + 0.1), t0, 0.13 if not quiet else 0.17)
    for i in range(4):
        bt = t0 + i * beat
        if not quiet:
            add(dry, kick(), bt, 0.6 if b > 0 or i > 0 else 0.0)
            if i in (1, 3):
                add(wet, clap(), bt, 0.24)
            add(dry, hat(), bt + beat / 2, 1.0)
            if b >= 4:
                add(dry, hat(0.008), bt + beat / 4, 0.5); add(dry, hat(0.008), bt + 3 * beat / 4, 0.5)
            add(dry, bass(ch[0], beat * 0.95), bt, 0.32)
        elif i in (0, 2):
            add(dry, bass(ch[0], beat * 1.9), bt, 0.24)
    arp = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[0] + 36, ch[2] + 24, ch[1] + 24, ch[2] + 24, ch[1] + 24]
    for i, m in enumerate(arp):
        add(wet, pluck(m), t0 + i * beat / 2, 0.15 if not quiet else 0.1)
    if b >= 4:                                # the tune comes in once the fixes start landing
        for bt, m in HOOK[name]:
            add(wet, keys(m + 12, 1.6, 0.5), t0 + bt * beat, 0.14 if not quiet else 0.2)
    if b == 10:                               # drum fill back in
        for i in range(8):
            add(dry, hat(0.012), t0 + 2 * beat + i * beat / 4, 0.5 + i * 0.12)
        add(wet, clap(), t0 + 3.5 * beat, 0.2)
# the last chord rings out under the end card
add(wet, pad([48, 52, 55, 60], DUR - end_at), end_at, 0.15)
add(dry, kick(), end_at, 0.6)
add(dry, bass(48, 2.5), end_at, 0.3)
add(wet, bell([note(72), note(76), note(79), note(84)], gap=0.08, tau=0.9, d=2.5), end_at, 0.45)
add(wet, hp(hp(rng.standard_normal(int(2.0 * SR)))) * env(2.0, 0.002, 0.6) * 0.1, end_at)

# ---- reverb: two different decaying-noise rooms, one per ear, for width
def room(seed):
    r = np.random.default_rng(seed)
    d = 2.0
    t = tt(d)
    ir = r.standard_normal(len(t)) * np.exp(-t / 0.42) * np.minimum(1, t / 0.012)
    return filt(ir, lo=250, hi=5200, order=1)


def conv(x, ir):
    n = len(x) + len(ir) - 1
    m = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]
    return y


rev = [conv(wet, room(s)) for s in (3, 4)]
scale = np.max(np.abs(wet)) / (np.max(np.abs(rev[0])) + 1e-9)
fade = np.clip((DUR - t_all) / 1.6, 0, 1)
music = np.stack([(dry + wet * 0.9 + r * scale * 0.33) * fade for r in rev], axis=1)


def write(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    pcm = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1 if x.ndim == 1 else x.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", os.path.join(OUT, name))


write("music.wav", music)
write("sfx.wav", sfx)
