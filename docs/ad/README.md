# Meta ad kit: "Answered first"

Everything here runs natively on Facebook and Instagram (feed, Stories and Reels). There are two ads: a video ad and a tap-through carousel. Both send people to the same place.

| File | What it is | Where it goes |
|---|---|---|
| `brb-ad-30s-story.mp4` | 30 s video, 1080×1920 | Stories and Reels |
| `brb-ad-30s-feed.mp4` | Same video, 1080×1350 | Facebook and Instagram feeds |
| `carousel/card-1…5-square.png` | 5 carousel cards, 1080×1080 | Feeds |
| `carousel/card-1…5-story.png` | Same 5 cards, 1080×1920 | Stories and Reels |
| `cover-story.jpg`, `cover-feed.jpg` | Video thumbnails | Optional cover frame |

Key text in every 9:16 file sits inside Meta's safe zone (top 14%, bottom 35% and 6% at the sides kept clear), so the Reels caption and button never cover it.

**Where the ads link:** `https://businessrunsbetter.com/ad/?utm_source=meta&utm_medium=paid&utm_campaign=answered-first`. That's the 60-second "9:47 PM test" (`ad/index.html`), which ends in a free-call booking. It goes live when the PR is merged. Until then, link straight to the booking page: `https://cal.com/mike-cavallo/business-is-better`.

---

## Ad 1: the video

**The hook:** "You didn't lose that job to a better business. You lost it to the one that answered first."

| Time | Voiceover | On screen |
|---|---|---|
| 0–5 s | You didn't lose that job to a better business. You lost it to the one that answered first. | A 9:47 PM text about a roof leak goes unanswered. At 7:12 AM: "Never mind. Found someone who answered right away." Job lost. |
| 5–13 s | Missed calls on the job. The same questions, all day. A website nobody finds. Ads you can't measure. Quotes at ten at night. | Notifications pile up as the day gets later |
| 13–15 s | Business Runs Better fixes that. | The logo draws itself |
| 15–19 s | Leads answered in seconds, day or night. | The same text, answered in 4 seconds and booked |
| 19–21 s | A website that rings your phone. | "Call now" tap, then an incoming call |
| 21–23 s | And AI that clears the busywork. | The notifications get checked off: "All caught up" |
| 23–30 s | Book a free twenty-minute call at Business Runs Better dot com. | businessrunsbetter.com, 910-524-0056 |

Captions are burned in word by word, because most feed video plays with the sound off.

### Set it up in Ads Manager

1. **Create** → objective **Traffic**, optimized for **Landing page views**. Once the Meta Pixel is on the site, switch to **Leads** so Meta finds people who actually book.
2. **Audience:** a radius around Leland/Wilmington (25 miles is a good start), ages 25–65, with Advantage+ audience on.
3. **Placements:** Advantage+ placements.
4. **Ad:** single video. Upload `brb-ad-30s-feed.mp4`, then use **Edit media per placement** (it may be labeled "placement asset customization") to put `brb-ad-30s-story.mp4` on Stories and Reels.
5. **Text:**
   - **Primary text:** You didn't lose that job to a better business. You lost it to the one that answered first. Leads answered in seconds, a website that rings your phone, and AI that clears the busywork. Book a free 20-minute call.
   - **Headline:** Take the 9:47 PM test
   - **Button:** Learn More
   - **URL:** the link above

## Ad 2: the tap-through carousel

On Stories, people tap through the cards one by one. In feeds, they swipe. The five cards tell the story in order:

| Card | Image | Headline (under the card in feeds) |
|---|---|---|
| 1 | A customer texts you at 9:47 PM. | A customer texts you at 9:47 PM |
| 2 | Nobody answered: "Found someone who answered right away." Job lost. | Nobody answered. Job lost. |
| 3 | The same text, answered in 4 seconds, booked by 9:48 | Answered in 4 seconds. Booked. |
| 4 | Missed calls, same questions, late quotes, invisible website, mystery ads: each one handled | The busywork, handled |
| 5 | Book a free 20-minute call, businessrunsbetter.com, 910-524-0056 | Book a free 20-minute call |

**Description on every card:** Business Runs Better · Leland, NC
**Button:** Learn More. **URL:** the same link on every card.

### Set it up in Ads Manager

1. Same campaign and ad set as the video. Add a second ad with format **Carousel**.
2. Add 5 cards with the square PNGs, in order 1 to 5.
3. **Untick "Automatically show the best-performing cards first."** If it stays on, Meta reorders the cards and the story stops making sense.
4. Untick the profile end card too: card 5 is already the end card.
5. For Stories and Reels, swap each card's image for its `-story.png` version under the per-placement media option. If Ads Manager doesn't offer that for carousels, duplicate the ad: keep the square cards on Feeds, and put the story cards on a copy limited to Stories and Reels.

**Primary text for the carousel:** A customer texts at 9:47 PM about a roof leak. Who answers? For businesses around Wilmington and Leland, I build the systems that answer every lead in seconds, get you found on Google, and take the busywork off your plate. Free 20-minute call, no pitch deck.

## Ad 3: the cartoon ("Dave")

`cartoon/brb-cartoon-30s-story.mp4` (1080×1920) and `cartoon/brb-cartoon-30s-feed.mp4` (1080×1350). Set it up exactly like Ad 1: one video ad, the feed file on Feeds and the story file on Stories and Reels.

| Time | Voiceover | On screen |
|---|---|---|
| 0–3.5 s | This is Dave. Dave works all the time. | Dave at his desk at night: the clock races, coffee piles up, the phone won't stop |
| 3.5–8.5 s | Calls on the roof. Texts at dinner. Quotes at midnight. Emails at five A.M. | Rain on the roof, a cold dinner, papers flying at midnight, a 5 AM alarm |
| 8.5–11.7 s | Always busy. Always behind. | A hamster wheel of chores spins faster until it throws him out |
| 11.7–14.6 s | Then Dave found Business Runs Better. | A little blue dot lands and becomes the logo |
| 14.6–19.8 s | Now leads get answered in seconds. Quotes get drafted. The website brings in calls. | Calls answered and booked, quotes ready to send, new leads from the website |
| 19.8–23.3 s | And Dave? Dave makes it home for dinner. | 5:30 PM. Dinner with the dog, phone face down |
| 23.3–30 s | Book a free call at Business Runs Better dot com. | businessrunsbetter.com, free 20-minute call, 910-524-0056 |

- **Primary text:** Meet Dave. Calls on the roof, texts at dinner, quotes at midnight. Then he found Business Runs Better. Now leads get answered in seconds, quotes get drafted, and Dave makes it home for dinner. Book a free 20-minute call.
- **Headline:** Get your evenings back
- **Button:** Learn More
- **URL:** `https://businessrunsbetter.com/ad/?utm_source=meta&utm_medium=paid&utm_campaign=dave-cartoon`

Run it next to Ad 1 in the same ad set and let Meta show the one that books more calls.

---

## Re-rendering

From the repo root, with `python3 -m http.server 8765` running (the pages load the site's fonts):

```bash
node docs/ad/render.cjs /tmp/story.mp4 story      # video frames, about a minute each
node docs/ad/render.cjs /tmp/feed.mp4 feed
python3 docs/ad/synth.py /tmp                     # music.wav and sfx.wav
cd /tmp && cp story.mp4 video-only.mp4 && cp <repo>/docs/ad/voiceover.mp3 . && bash <repo>/docs/ad/mix.sh 0.42 brb-ad-30s-story.mp4
node docs/ad/render-cards.cjs                     # the 10 carousel PNGs into docs/ad/carousel/
```

The cartoon lives in `docs/ad/cartoon/`: `voiceover.py` then `retime.py` (fits the voice to 30 s and writes `words-timed.json`), `scene.html` (all the drawing), `render.cjs`, `synth.py` and `mix.sh`, the same way as above.

To view a single moment, open `docs/ad/scene.html?format=feed&t=12.5`; add `&play` to watch it run. To change the words, edit `TEXT` in `voiceover.py` and run it in `docs/ad/` (it writes `voiceover.mp3` and `words.json`), then adjust the cue times in `scene.html` and `synth.py`. The voice is ElevenLabs "Chris". The music and sound effects are synthesized in `synth.py`, so there is nothing to license.
