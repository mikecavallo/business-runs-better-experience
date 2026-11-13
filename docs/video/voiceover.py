#!/usr/bin/env python3
# Voiceover for the 60-second "Meet Ray" video, one ElevenLabs request per line so each
# line can be placed on the timeline. Writes vo/NN.mp3 and segments.json (word timings).
# "dummy" stands in for the API key (the session proxy injects the real one).
#   python3 voiceover.py [VOICE_ID] [only-these-indexes ...]
import json, base64, urllib.request, sys, os
VOICE = sys.argv[1] if len(sys.argv) > 1 else "nPczCjzI2devNBz1zQrb"  # ElevenLabs "Brian"
ONLY = [int(x) for x in sys.argv[2:]]
LINES = [
 "This is Ray. One of the best roofers in town.",
 "But Ray doesn't run his business. His business runs him.",
 "The phone rings while he's on a roof. Missed call. Missed job.",
 "His website is buried on page four of Google.",
 "Twelve hundred a month on ads, and no clue if they work.",
 "And at ten at night? He's still writing quotes.",
 "Ray doesn't need to work harder. He needs his business to run better.",
 "First, a website that gets found, and makes the phone ring.",
 "Then an AI receptionist that picks up every call, and books the job.",
 "New leads get a reply in four seconds. Even at 9:47 at night.",
 "And one dashboard shows him exactly what's working.",
 "Ray's still one of the best roofers in town. Now, he's home for dinner.",
 "Business Runs Better. Websites, marketing, and AI for local business. Book your free call today.",
]
os.makedirs("vo", exist_ok=True)
segs = json.load(open("segments.json")) if os.path.exists("segments.json") else [None] * len(LINES)
for i, text in enumerate(LINES):
    if ONLY and i not in ONLY: continue
    body = {"text": text, "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.42, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": 1.06}}
    if i > 0: body["previous_text"] = " ".join(LINES[max(0, i - 2):i])
    if i < len(LINES) - 1: body["next_text"] = LINES[i + 1]
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_192",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": "dummy"})
    d = json.load(urllib.request.urlopen(req, timeout=180))
    open(f"vo/{i:02d}.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    a = d["alignment"]
    words, cur, s, e = [], "", 0, 0
    for c, a1, b1 in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
        if c.isspace():
            if cur: words.append([cur, round(s, 3), round(e, 3)]); cur = ""
            continue
        if not cur: s = a1
        cur += c; e = b1
    if cur: words.append([cur, round(s, 3), round(e, 3)])
    segs[i] = {"text": text, "dur": words[-1][2], "words": words}
    print(i, round(words[-1][2], 2), text)
json.dump(segs, open("segments.json", "w"))
print("total speech", round(sum(s["dur"] for s in segs), 2))
