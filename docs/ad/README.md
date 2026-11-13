# Meta ad kit

Everything here runs natively on Facebook and Instagram (feeds, Stories and Reels). There are three ads, and all of them send people to the same place.

| File | What it is |
|---|---|
| `brb-ad-30s.mp4` | Ad 1, "Answered first": 30 s video, 1080×1920 |
| `cartoon/brb-cartoon-30s.mp4` | Ad 3, "Dave": 30 s cartoon, 1080×1920 |
| `carousel/card-1…5-square.png` | Ad 2, the tap-through carousel: 5 cards, 1080×1080, for feeds |
| `carousel/card-1…5-story.png` | The same 5 cards, 1080×1920, for Stories and Reels |
| `cover.jpg`, `cartoon/cover.jpg` | Optional cover frames for the videos |

**One file per video.** Each video is a single 1080×1920 file used on every placement. Stories and Reels show all of it. Feeds show the middle 4:5 of a tall video, so everything that has to be read sits between 285 px and 1250 px from the top. That band is inside the feed's crop and inside Meta's Reels safe zone (top 14%, bottom 35% and 6% at the sides kept clear), so the Reels caption and button never cover it.

**Where the ads link:** `https://businessrunsbetter.com/ad/?utm_source=meta&utm_medium=paid&utm_campaign=answered-first` (use `utm_campaign=dave-cartoon` for the cartoon). That's the 60-second "9:47 PM test" (`ad/index.html`), which ends in a free-call booking. It goes live when the PR is merged. Until then, link straight to the booking page: `https://cal.com/mike-cavallo/business-is-better`.

### Set up a video ad in Ads Manager

1. **Create** → objective **Traffic**, optimized for **Landing page views**. Once the Meta Pixel is on the site, switch to **Leads** so Meta finds people who actually book.
2. **Audience:** a radius around Leland/Wilmington (25 miles is a good start), ages 25–65, with Advantage+ audience on.
3. **Placements:** Advantage+ placements.
4. **Ad:** single video. Upload the one file.
5. **Text:** primary text, headline, button and URL from the ad's section below.

Run Ad 1 and Ad 3 in the same ad set and let Meta show more of whichever books more calls.

---

## Ad 1: "Answered first"

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

- **Primary text:** You didn't lose that job to a better business. You lost it to the one that answered first. Leads answered in seconds, a website that rings your phone, and AI that clears the busywork. Book a free 20-minute call.
- **Headline:** Take the 9:47 PM test
- **Button:** Learn More

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

1. Same campaign and ad set as the videos. Add an ad with format **Carousel**.
2. Add 5 cards with the square PNGs, in order 1 to 5.
3. **Untick "Automatically show the best-performing cards first."** If it stays on, Meta reorders the cards and the story stops making sense.
4. Untick the profile end card too: card 5 is already the end card.
5. For Stories and Reels, swap each card's image for its `-story.png` version under the per-placement media option. If Ads Manager doesn't offer that for carousels, duplicate the ad: keep the square cards on Feeds, and put the story cards on a copy limited to Stories and Reels.

**Primary text:** A customer texts at 9:47 PM about a roof leak. Who answers? For businesses around Wilmington and Leland, I build the systems that answer every lead in seconds, get you found on Google, and take the busywork off your plate. Free 20-minute call, no pitch deck.

## Ad 3: the cartoon ("Dave")

Dave works non-stop. Business Runs Better gives him his time back, he uses it to take on more jobs and hire a second crew, and he still makes it home for dinner.

| Time | Voiceover | On screen |
|---|---|---|
| 0–3.3 s | This is Dave. Dave never stops. | Dave at his desk at night: the clock races, coffee piles up, the phone won't stop |
| 3.3–6.9 s | Calls on the roof. Texts at dinner. Quotes at midnight. | Rain on the roof, a cold dinner, papers flying at midnight |
| 6.9–10 s | Always busy. Always behind. | A hamster wheel of chores spins faster until it throws him out |
| 10–12.5 s | Then Dave found Business Runs Better. | A little blue dot lands and becomes the logo |
| 12.5–16.1 s | Now leads get answered in seconds. Quotes go out the same day. | Calls answered and booked, quotes sent the same day |
| 16.1–21.1 s | With the time back, Dave takes on more jobs. Hires a second crew. Revenue's up. | The job board fills up, a second crew joins, a revenue arrow shoots up |
| 21.1–24.2 s | And Dave? He still makes it home for dinner. | 5:30 PM. Dinner with the dog, phone face down |
| 24.2–30 s | Book a free call at Business Runs Better dot com. | businessrunsbetter.com, free 20-minute call, 910-524-0056 |

- **Primary text:** Meet Dave. Calls on the roof, texts at dinner, quotes at midnight. Then he found Business Runs Better. Now his leads get answered in seconds, he takes on more jobs, runs two crews, and still makes it home for dinner. Book a free 20-minute call.
- **Headline:** More jobs. Same evenings.
- **Button:** Learn More

---

## Re-rendering

From the repo root, with `python3 -m http.server 8765` running (the pages load the site's fonts):

```bash
# Ad 1
node docs/ad/render.cjs /tmp/video-only.mp4 story    # 900 frames, about a minute
python3 docs/ad/synth.py /tmp                        # music.wav and sfx.wav
cp docs/ad/voiceover.mp3 /tmp/ && cd /tmp && bash <repo>/docs/ad/mix.sh 0.42 brb-ad-30s.mp4
# Ad 2
node docs/ad/render-cards.cjs                        # the 10 carousel PNGs into docs/ad/carousel/
# Ad 3, from docs/ad/cartoon/
python3 voiceover.py && python3 retime.py           # voice, then fit it to 30 s (writes vo-timed.wav, words-timed.json)
node render.cjs /tmp/v.mp4 && python3 synth.py /tmp && cp vo-timed.wav mix.sh /tmp/ && cd /tmp && ./mix.sh v.mp4 brb-cartoon-30s.mp4
```

To view a single moment, open `docs/ad/scene.html?t=12.5` or `docs/ad/cartoon/scene.html?t=12.5`; add `&play` to watch it run. To change the words, edit `TEXT` in the matching `voiceover.py`, then check the cue times in `scene.html` and `synth.py`. The voice is ElevenLabs "Chris". The music and sound effects are synthesized in the `synth.py` files, so there is nothing to license.
