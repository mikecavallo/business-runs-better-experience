# Social ad: "Answered first"

Two pieces that work together:

| | File | Use it for |
|---|---|---|
| Video ad, 30 s, 1080×1920 | `docs/ad/brb-ad-30s.mp4` | Reels, Stories, TikTok, Shorts. Voiceover, music and sound effects. |
| Same video, no music | `docs/ad/brb-ad-30s-no-music.mp4` | Upload this one if you want to add music from the platform's own library. |
| Cover frame | `docs/ad/cover.jpg` | Thumbnail / Reels cover. |
| Interactive ad | `ad/index.html` → `businessrunsbetter.com/ad/` | Where the ad's button sends people. A 60-second test that ends in a booked call. |

## The hook

> You didn't lose that job to a better business. You lost it to the one that answered first.

Over a phone: a customer texts about a roof leak at 9:47 PM, nobody answers, and at 7:12 AM she writes back "Never mind. Found someone who answered right away." It is the same 9:47 PM story as the site's intro, so the ad and the site feel like one thing.

## Voiceover script (27 s)

| Time | Line | On screen |
|---|---|---|
| 0–5 s | You didn't lose that job to a better business. You lost it to the one that answered first. | The 9:47 PM text, no reply, "Job lost" |
| 5–13 s | Missed calls on the job. The same questions, all day. A website nobody finds. Ads you can't measure. Quotes at ten at night. | Notifications pile up as the day gets later: 2:14 PM to 10:04 PM |
| 13–15 s | Business Runs Better fixes that. | The logo draws itself |
| 15–19 s | Leads answered in seconds, day or night. | Same text, answered in 4 seconds, booked for 10:30 AM |
| 19–21 s | A website that rings your phone. | Client site, "Call now" tap, incoming call |
| 21–23 s | And AI that clears the busywork. | The same notifications checked off and swiped away: "All caught up" |
| 23–30 s | Book a free twenty-minute call at Business Runs Better dot com. | End card: businessrunsbetter.com, 910-524-0056, Leland, NC |

Every problem named maps to a real service with a posted price: lead follow-up and AI receptionist, AI assistants, web design, ads management, estimate automation.

Captions are burned in, word by word, because most feed video plays muted. Everything that matters sits between 250 px and 1500 px from the top, clear of the platform's buttons and caption area.

## Post copy

**Primary text (short):**
You didn't lose that job to a better business. You lost it to the one that answered first. Leads answered in seconds, a website that rings your phone, and AI that clears the busywork. Book a free 20-minute call.

**Primary text (local):**
A customer texts at 9:47 PM about a roof leak. Who answers? For businesses around Wilmington and Leland, I build the systems that answer every lead in seconds, get you found on Google, and take the busywork off your plate. Free 20-minute call, no pitch deck.

**Headline:** Take the 9:47 PM test
**Button:** Learn More (to `/ad/`) or Book Now (straight to the calendar)
**Link:** `https://businessrunsbetter.com/ad/?utm_source=meta&utm_medium=paid&utm_campaign=answered-first`

## The interactive ad (`/ad/`)

1. **The 9:47 PM test.** Sarah's text arrives. The visitor picks what happens at their business: nobody sees it until morning (job lost), they answer it from the couch (saved, at the cost of their evening), or something answers in seconds. Then they can replay it the 4-second way.
2. **Your week.** Tap the busywork that eats the week and set the hours, plus two growth problems (website, ads) and what an hour of their time is worth. A running total shows hours a week and dollars a month.
3. **Your plan.** Hours, workdays and dollars a month; how fast a $2,500 build pays for itself if it took even half of that work away; the top three fixes with their posted prices; then "Book a free 20-minute call". The booking link carries their answers in the Cal.com notes, so the call starts where the test left off.

Nothing is sent anywhere until they book. The page is `noindex`, uses the site's own fonts, and makes no outside requests.

## Re-rendering the video

From the repo root:

```bash
python3 -m http.server 8765 &              # scene.html loads the site's fonts
node docs/ad/render.cjs /tmp/video-only.mp4   # 900 frames, about a minute
python3 docs/ad/synth.py /tmp                # music.wav and sfx.wav
cp docs/ad/voiceover.mp3 /tmp/ && cd /tmp && bash path/to/docs/ad/mix.sh 0.42 brb-ad-30s.mp4
```

Open `docs/ad/scene.html?t=12.5` to look at one moment, or `?play` to watch it run.

To change the words, edit `TEXT` in `voiceover.py` and run it in `docs/ad/` (it writes `voiceover.mp3` and `words.json`), then check the cue times in `scene.html` and `synth.py`. The voice is ElevenLabs "Chris". Music and sound effects are synthesized in `synth.py`, so there is nothing to license.
