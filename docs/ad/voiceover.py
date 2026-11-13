#!/usr/bin/env python3
# Voiceover for the video ad, with per-character timing, from ElevenLabs.
# Writes voiceover.mp3 and alignment.json. "dummy" stands in for your API key.
import json, base64, urllib.request, sys
VOICE = sys.argv[1] if len(sys.argv) > 1 else "iP95p4xoKVk53GoZ742B"  # ElevenLabs "Chris"
TEXT = ("You didn't lose that job to a better business. <break time=\"0.25s\" /> You lost it to the one that answered first. <break time=\"0.5s\" /> "
        "Missed calls on the job. The same questions, all day. A website nobody finds. Ads you can't measure. Quotes at ten at night. <break time=\"0.5s\" /> "
        "Business Runs Better fixes that. Leads answered in seconds, day or night. A website that rings your phone. And AI that clears the busywork. <break time=\"0.35s\" /> "
        "Book a free twenty-minute call at Business Runs Better dot com.")
body = json.dumps({"text": TEXT, "model_id": "eleven_multilingual_v2",
   "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True, "speed": 1.04}}).encode()
req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192",
     data=body, headers={"Content-Type": "application/json", "xi-api-key": "dummy"})
d = json.load(urllib.request.urlopen(req, timeout=180))
open("voiceover.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
json.dump(d.get("alignment"), open("alignment.json", "w"))
print("ok", len(d["alignment"]["characters"]), d["alignment"]["character_end_times_seconds"][-1])

# words.json: one [word, start, end] per spoken word, for the captions in scene.html
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
print("words.json:", len(words), "words")
