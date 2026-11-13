# "Meet Ray": the 60-second marketing video

`brb-meet-ray-60s.mp4` is a 60-second, 1920×1080 story for the website, YouTube, LinkedIn and Facebook feed. `poster.jpg` is its thumbnail.

Ray is a made-up roofer. The first 22 seconds are his problems, the turn is the logo, and the rest is what Business Runs Better does about each one. Every fix shown is a service on the site, and the 9:47 PM text thread is the one from the homepage.

| Time | Voiceover | On screen |
|---|---|---|
| 0–3 s | This is Ray. One of the best roofers in town. | Ray on a roof at sunrise, hammering |
| 3–7 s | But Ray doesn't run his business. His business runs him. | Notifications pile onto him: missed calls, overdue quotes, a 1-star review |
| 7–12 s | The phone rings while he's on a roof. Missed call. Missed job. | The call rings out. Three missed calls, "3 jobs gone" |
| 12–15 s | His website is buried on page four of Google. | Search results scroll past everyone else down to Ray, cobweb included |
| 15–19 s | Twelve hundred a month on ads, and no clue if they work. | Cash flies into a hole marked ADS. Leads: ??? |
| 19–22 s | And at ten at night? He's still writing quotes. | 10:04 PM at the kitchen table, dinner gone cold |
| 22–28 s | Ray doesn't need to work harder. He needs his business to run better. | Black screen, the line, then the logo lands |
| 28–32 s | First, a website that gets found, and makes the phone ring. | New site, page 4 becomes page 1, "Call now" tapped, a call comes in |
| 32–37 s | Then an AI receptionist that picks up every call, and books the job. | The AI takes the call and books Thursday 10:30. 3 of 3 answered |
| 37–42 s | New leads get a reply in four seconds. Even at 9:47 at night. | Sarah's roof-leak text, answered and booked while Ray sleeps |
| 42–46 s | And one dashboard shows him exactly what's working. | Leads, cost per lead, jobs booked. Ads: $1,200 in, 14 leads, 6 jobs |
| 46–51 s | Ray's still one of the best roofers in town. Now, he's home for dinner. | 5:42 PM, same kitchen, Ray and his kid at the table |
| 51–60 s | Business Runs Better. Websites, marketing, and AI for local business. Book your free call today. | Logo, "Book your free 20-minute call", businessrunsbetter.com, 910-524-0056 |

Captions are burned in, so it works with the sound off. The numbers on Ray's dashboard are illustrative, like Ray. The end card says so: "Ray is made up. His problems aren't."

## Re-rendering

From the repo root, with `python3 -m http.server 8765` running (the page loads the site's fonts):

```bash
node docs/video/render.cjs /tmp/ray/video-only.mp4      # 1,800 frames, a few minutes
python3 docs/video/synth.py /tmp/ray                    # music.wav and sfx.wav
bash docs/video/mix.sh /tmp/ray/video-only.mp4 /tmp/ray docs/video/brb-meet-ray-60s.mp4
```

To view one moment, open `docs/video/scene.html?t=12.5`; add `&play` to watch it run (silent).

- **Change the words:** edit `LINES` in `voiceover.py` and run it in `docs/video/` (`python3 voiceover.py VOICE_ID 3 4` redoes only lines 3 and 4). It writes `vo/NN.mp3` and `segments.json`. On-screen beats and sound effects follow the word timings on their own.
- **Change the pacing:** `timeline.json` holds the second each line starts. If a scene needs to be longer, move the line starts and the matching scene boundaries (`SC` in `scene.html`, `CUT` in `synth.py`).
- The voice is ElevenLabs "Brian". The music and sound effects are synthesized in `synth.py`, so there is nothing to license.
