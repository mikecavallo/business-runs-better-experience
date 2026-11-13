#!/usr/bin/env python3
# Voiceover for the cartoon ad, with per-character timing, from ElevenLabs.
# Writes voiceover.mp3 and words.json. "dummy" stands in for your API key.
import json, base64, urllib.request, sys
VOICE = sys.argv[1] if len(sys.argv) > 1 else "iP95p4xoKVk53GoZ742B"  # ElevenLabs "Chris"
B = lambda s: f'<break time="{s}s" />'
TEXT = (f"This is Dave. {B(0.15)} Dave never stops. {B(0.3)} "
        f"Calls on the roof. Texts at dinner. Quotes at midnight. {B(0.3)} "
        f"Always busy. Always behind. {B(0.4)} "
        f"Then Dave found Business Runs Better. {B(0.3)} "
        f"Now leads get answered in seconds. Quotes go out the same day. {B(0.3)} "
        f"With the time back, Dave takes on more jobs. Hires a second crew. Revenue's up. {B(0.3)} "
        f"And Dave? He still makes it home for dinner. {B(0.35)} "
        f"Book a free call at Business Runs Better dot com.")
body = json.dumps({"text": TEXT, "model_id": "eleven_multilingual_v2",
   "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.06}}).encode()
req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192",
     data=body, headers={"Content-Type": "application/json", "xi-api-key": "dummy"})
d = json.load(urllib.request.urlopen(req, timeout=180))
open("voiceover.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
a = d["alignment"]
words, cur, s, e = [], "", 0, 0
for c, a1, b1 in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
    if c.isspace():
        if cur: words.append([cur, round(s, 3), round(e, 3)]); cur = ""
        continue
    if not cur: s = a1
    cur += c; e = b1
if cur: words.append([cur, round(s, 3), round(e, 3)])
words = [w for w in words if not (w[0].startswith("<") or w[0].startswith("time=") or w[0] == "/>")]
json.dump(words, open("words.json", "w"))
print(len(words), "words, ends at", words[-1][2])
print(" ".join(f"{w}@{s:.2f}" for w, s, e in words))
