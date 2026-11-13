#!/usr/bin/env python3
"""
Music and sound effects for the cartoon ad, synthesized with numpy (nothing licensed).
Cue times come from words-timed.json the same way scene.html computes them.
  python3 docs/ad/cartoon/synth.py OUT_DIR      -> music.wav, sfx.wav
"""
import sys, os, json, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
SR, DUR = 44100, 30.0
N = int(SR * DUR)
rng = np.random.default_rng(11)

# ---- cue times, same rules as scene.html
W = json.load(open(os.path.join(HERE, "words-timed.json")))
COUNTS = [3, 5, 4, 3, 3, 4, 2, 2, 6, 6, 3, 5, 2, 6, 10]
P, i = {}, 0
for k, n in enumerate(COUNTS):
    P[k + 1] = W[i][1] - .12; i += n
P[1] = 0.0
FLING = next(w for w in W if w[0] == "behind.")[2] + .1
LAND = FLING + .65
CTA = W[-5][1] - .05
ANSWERED = P[10] + .9

def tt(d): return np.arange(int(d * SR)) / SR
def add(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf) or i < 0: return
    sig = sig[: len(buf) - i]; buf[i:i + len(sig)] += sig * gain
def env(d, a=.003, tau=.2):
    t = tt(d); return np.minimum(1, t / a) * np.exp(-t / tau)
def onepole(x, cutoff):
    cutoff = np.broadcast_to(np.asarray(cutoff, float), x.shape); a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    for j in range(len(x)): acc += a[j] * (x[j] - acc); y[j] = acc
    return y
def hp(x): return np.diff(x, prepend=0)
def note(m): return 440 * 2 ** ((m - 69) / 12)
def sweep(f0, f1, d, shape=1.0):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** shape
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ---------------- sound effects
def pop():
    d = .12; return sweep(300, 1200, d, .5) * env(d, .002, .03)
def ding(f1=1568, f2=2093):
    d = .9; out = np.zeros(int(d * SR))
    for k, f in enumerate([f1, f2]):
        t = tt(d - k * .08); add(out, (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)) * env(d - k * .08, .002, .2), k * .08, .5)
    return out
def buzz():
    d = .4; t = tt(d); car = np.tanh(3 * np.sin(2 * np.pi * 160 * t))
    gate = onepole(((t < .13) | ((t > .2) & (t < .33))).astype(float), 60); return onepole(car * gate, 900) * .7
def whoosh(d=.4, lo=300, hi=5000, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); sw = lo + (hi - lo) * ((t / d) if up else 1 - t / d) ** 1.5
    s = onepole(n, sw); s = s - onepole(s, sw * .25); return s * np.sin(np.pi * t / d) ** 2 * 1.6
def thud():
    d = .5; t = tt(d); s = np.sin(2 * np.pi * np.cumsum(40 + 70 * np.exp(-t / .04)) / SR) * env(d, .002, .18)
    return s + onepole(rng.standard_normal(len(t)), 500) * env(d, .001, .04) * .8
def knock():
    d = .12; t = tt(d); return (np.sin(2 * np.pi * 220 * t) * .6 + onepole(rng.standard_normal(len(t)), 1500) * .7) * env(d, .001, .025)
def scribble(d):
    t = tt(d); n = hp(rng.standard_normal(len(t))); g = (np.sin(2 * np.pi * 7 * t) > -.2).astype(float)
    return onepole(n, 3000) * onepole(g, 40) * .5
def alarm(d):
    t = tt(d); f = np.where((t * 16) % 2 < 1, 2100, 2500)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .18 * onepole(((t * 8) % 1 < .7).astype(float), 200)
def rain(d):
    t = tt(d); n = rng.standard_normal(len(t)); s = onepole(n, 3500) - onepole(n, 600)
    fade = np.minimum(1, t / .08) * np.minimum(1, (d - t) / .08); return s * fade * .5
def squeak(f=900):
    d = .14; t = tt(d); return np.sin(2 * np.pi * np.cumsum(f + 400 * np.sin(np.pi * t / d)) / SR) * env(d, .01, .06) * .5
def slide_whistle(d):
    t = tt(d); f = np.where(t < d * .55, 400 + 1100 * (t / (d * .55)), 1500 - 1200 * ((t - d * .55) / (d * .45)))
    vib = 1 + .02 * np.sin(2 * np.pi * 6 * t)
    return np.sin(2 * np.pi * np.cumsum(f * vib) / SR) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .05) * .5
def scratch():
    d = .35; t = tt(d); n = rng.standard_normal(len(t)); f = 3000 * np.abs(np.sin(2 * np.pi * 4 * t)) + 300
    return (onepole(n, f) - onepole(n, f * .3)) * env(d, .002, .12) * 1.4
def tweet():
    d = .12; t = tt(d); return np.sin(2 * np.pi * np.cumsum(2600 + 900 * np.sin(2 * np.pi * 18 * t)) / SR) * env(d, .005, .05) * .4
def chime_arp(base=72, n=6, gap=.07, tau=.6):
    d = n * gap + 1.6; out = np.zeros(int(d * SR)); steps = [0, 4, 7, 11, 12, 16, 19, 23]
    for k in range(n):
        f = note(base + steps[k % len(steps)]); t = tt(d - k * gap)
        add(out, (np.sin(2 * np.pi * f * t) + .2 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / .1)) * env(d - k * gap, .002, tau), k * gap, .3)
    return out
def ring():
    out = np.zeros(int(.5 * SR))
    for k, m in enumerate([88, 84, 88, 84]):
        d = .15; t = tt(d); f = note(m); add(out, np.sin(2 * np.pi * f * t) * env(d, .002, .06), k * .075, .4)
    return out
def bloop(m=76):
    d = .25; return sweep(note(m), note(m + 7), d, .3) * env(d, .004, .08) * .7
def stamp():
    s = thud() * .6; k = knock(); s[:len(k)] += k * .8; return s

sfx = np.zeros(N)
# intro: clock races, mugs pile up, phone buzzes
add(sfx, pop(), .7, .5)
for k in range(28):
    tk = P[2] + k * max(.05, .22 - k * .006)
    if tk < P[3]: add(sfx, knock(), tk, .18)
for k, a in enumerate([.1, .4, .7, 1.0]): add(sfx, pop(), P[2] + a, .55)
for a in np.arange(P[2] + .2, P[3], .45): add(sfx, buzz(), a, .4)
# roof: rain, buzzing, hammer
add(sfx, rain(P[4] - P[3]), P[3], .55)
for a in np.arange(P[3] + .05, P[4], .45): add(sfx, buzz(), a, .35)
add(sfx, pop(), P[3] + .15, .5)
for a in np.arange(P[3] + .1, P[4] - .05, .22): add(sfx, knock(), a, .35)
# dinner: three texts
for k, a in enumerate([.05, .3, .55]): add(sfx, ding(1568 + k * 200, 2093 + k * 200), P[4] + a, .55)
# midnight: scribbling, papers fly
add(sfx, scribble(P[6] - P[5]), P[5], .45)
add(sfx, whoosh(.5, 600, 6000), P[5] + .2, .3)
add(sfx, pop(), P[5] + .3, .45)
# 5 AM: alarm
add(sfx, alarm(P[7] - P[6] - .05), P[6], .7)
add(sfx, pop(), P[6] + .2, .45)
# wheel: squeaks speed up, chores pop in, then the fling
a = P[7]
while a < FLING:
    add(sfx, squeak(800 + 600 * (a - P[7]) / (FLING - P[7])), a, .35)
    a += max(.09, .32 - (a - P[7]) * .08)
for k in range(6): add(sfx, pop(), P[7] + k * .18, .35)
add(sfx, scratch(), FLING - .05, .8)
add(sfx, slide_whistle(LAND - FLING), FLING, .6)
add(sfx, thud(), LAND, 1.0)
for a in np.arange(LAND + .15, P[9] + .35, .28): add(sfx, tweet(), a, .5)
# the reveal
add(sfx, chime_arp(84, 5, .09, .8), P[9] + .1, .6)
add(sfx, chime_arp(72, 8, .07, 1.0), P[9] + 1.1, .8)
add(sfx, whoosh(.3, 3000, 200, up=False), P[10] - .3, .35)
add(sfx, pop(), P[10] + .02, .6)
# the better day
for a in np.arange(P[10] + .15, ANSWERED, .5): add(sfx, ring(), a, .5)
add(sfx, whoosh(.35, 1500, 8000), P[10] + .45, .25)
add(sfx, ding(2093, 2637), ANSWERED, .55); add(sfx, ding(2349, 3136), ANSWERED + .35, .45)
add(sfx, whoosh(.4, 500, 5000), P[11], .3); add(sfx, whoosh(.3, 1500, 8000), P[11] + .3, .22)
add(sfx, stamp(), P[11] + .85, .7); add(sfx, ding(2093, 2637), P[11] + .9, .45)
for k in range(3): add(sfx, bloop(76 + k * 2), P[12] + .3 + k * .32, .55)
for a in np.arange(P[12] + 1.0, P[13], .5): add(sfx, ring(), a, .45)
add(sfx, whoosh(.35, 300, 3000), P[13], .25)
add(sfx, pop(), P[13] + .2, .5); add(sfx, ding(1760, 2637), P[13] + .35, .4)
add(sfx, chime_arp(96, 3, .04, .25), P[13] + .85, .4)
add(sfx, chime_arp(79, 4, .08, .7), P[14] + .05, .4)
add(sfx, whoosh(.4, 300, 3000), P[15], .3)
add(sfx, pop(), CTA, .6); add(sfx, chime_arp(84, 3, .06, .5), CTA + .7, .35)
add(sfx, chime_arp(96, 3, .04, .25), 28.2, .35)

# ---------------- music
music = np.zeros(N)
def pluck(m, d=.3, tau=.12, bright=.5):
    t = tt(d); f = note(m)
    s = np.sin(2 * np.pi * f * t) + bright * np.sin(4 * np.pi * f * t) * np.exp(-t / .04) + .25 * np.sin(6 * np.pi * f * t) * np.exp(-t / .02)
    return s * env(d, .002, tau)
def kick():
    d = .3; t = tt(d); return np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-t / .03)) / SR) * env(d, .001, .14)
def hat():
    d = .05; t = tt(d); return hp(hp(rng.standard_normal(len(t)))) * env(d, .0005, .015) * .22
def clap():
    d = .2; t = tt(d); n = rng.standard_normal(len(t)); return hp(onepole(n, 2500)) * (env(d, .001, .07) + .6 * ((t > .012) & (t < .02))) * .9
def bass(m, d):
    t = tt(d); f = note(m - 12); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * env(d, .004, .25)

# grind: 150 BPM, A minor, staccato and a little silly
bpm = 150; b = 60 / bpm
line_notes = [57, 64, 57, 60, 57, 64, 62, 60]
t0, k = 0.0, 0
while t0 < FLING - .05:
    m = line_notes[k % 8]
    add(music, pluck(m - 12, .25, .07, .3), t0, .5)
    if k % 2 == 0: add(music, pluck([69, 72, 76, 74][(k // 2) % 4], .2, .06, .6), t0, .18 * min(1, t0 / 3 + .4))
    add(music, hat(), t0 + b / 2, .7)
    if k % 4 == 0 and t0 > P[3]: add(music, kick(), t0, .45)
    t0 += b / 2; k += 1
# reveal: a warm swell
d = P[10] - (P[9] + .1); t = tt(d)
swell = sum(np.sin(2 * np.pi * note(m) * t + m) for m in [60, 64, 67, 71, 76]) / 5
add(music, swell * np.minimum(1, t / (d * .7)) * np.minimum(1, (d - t) / .15), P[9] + .1, .35)
# the better day: 112 BPM, C major, strummed and bouncy
bpm = 112; b = 60 / bpm
chords = [[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 79], [65, 69, 72, 77]]
roots = [48, 53, 55, 53]
t0 = P[10]; k = 0
end_at = 28.4
pattern = [1, 0, 1, 1, 0, 1, 1, 0]   # down . up up . up down .
mel = [76, 79, 81, 79, 76, 74, 72, 74]
while t0 < end_at - .01:
    bar, step = divmod(k, 8)
    ch = chords[bar % 4]
    if pattern[step]:
        for j, m in enumerate(ch if step % 2 == 0 else ch[::-1]):
            add(music, pluck(m, .45, .16, .45), t0 + j * .012, .11)
    if step % 2 == 0:
        add(music, bass(roots[bar % 4], b * .9), t0, .38 if step % 4 == 0 else .22)
        add(music, kick(), t0, .45 if step % 4 == 0 else 0)
    if step in (2, 6): add(music, clap(), t0, .22)
    add(music, hat(), t0 + b / 4, .5)
    if step % 4 == 0 and bar % 2 == 1: add(music, pluck(mel[(bar * 2 + step // 4) % 8] + 12, .6, .3, .2), t0, .09)
    t0 += b / 2; k += 1
for j, m in enumerate([60, 64, 67, 72, 76]): add(music, pluck(m, 1.6, .7, .4), end_at + j * .03, .14)
add(music, bass(48, 1.5), end_at, .35); add(music, kick(), end_at, .45)
music *= np.clip((DUR - np.arange(N) / SR) / .8, 0, 1)

def write(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * .89
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    print("wrote", os.path.join(OUT, name))
write("music.wav", music); write("sfx.wav", sfx)
