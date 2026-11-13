#!/usr/bin/env python3
"""Fit the voiceover to the 30-second cartoon: slow it a touch, add two pauses, start it a beat in.
Writes vo-timed.wav and words-timed.json (word times on the video's own clock)."""
import json, subprocess
TEMPO, START = 0.94, 0.6
words = json.load(open("words.json"))
# pauses: after "behind." (the wheel collapses) and after "dinner." (the happy dinner lands)
names = [w[0] for w in words]
pauses = [(names.index("behind."), 0.7), (len(names) - 1 - names[::-1].index("dinner."), 0.5)]
cuts = sorted(((words[i][2] + words[i + 1][1]) / 2, d) for i, d in pauses)
# build the audio: slowed, split at the cuts, silence inserted
parts, prev, filt, labels = [], 0.0, [], []
bounds = [c for c, _ in cuts] + [None]
for k, b in enumerate(bounds):
    trim = f"atrim=start={prev}" + (f":end={b}" if b else "")
    filt.append(f"[0:a]{trim},asetpts=PTS-STARTPTS,atempo={TEMPO}[p{k}]")
    labels.append(f"[p{k}]")
    if b:
        filt.append(f"anullsrc=r=44100:cl=mono,atrim=duration={cuts[k][1]}[s{k}]")
        labels.append(f"[s{k}]")
        prev = b
filt.append(f"anullsrc=r=44100:cl=mono,atrim=duration={START}[lead]")
fc = ";".join(filt) + ";[lead]" + "".join(labels) + f"concat=n={len(labels) + 1}:v=0:a=1,aformat=sample_rates=44100:channel_layouts=mono[out]"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "voiceover.mp3", "-filter_complex", fc, "-map", "[out]", "vo-timed.wav"], check=True)
def remap(t):
    shift = sum(d for c, d in cuts if t > c)
    return round(START + t / TEMPO + shift, 3)
out = [[w, remap(s), remap(e)] for w, s, e in words]
json.dump(out, open("words-timed.json", "w"))
print("ends at", out[-1][2])
print(" ".join(f"{w}@{s:.2f}" for w, s, e in out))
