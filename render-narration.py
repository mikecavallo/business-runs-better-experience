#!/usr/bin/env python3
"""
Pre-render the Business Runs Better narration with Kokoro (local, port 8880).

Run this ONLY when the narration copy or the chosen voice changes.
The output is one static audio file per intro screen (the landing page has none).
They ship with the site, so the server needs no TTS, no Python and no GPU. Playback is just <audio>.
After re-rendering, bump AUDIO_V in index.html so browsers drop their cached copies.

  python3 render-narration.py --voice bm_george
"""
import argparse, json, os, subprocess, sys, urllib.request

KOKORO = "http://127.0.0.1:8880/v1/audio/speech"

# one clip per intro screen, in story order, named after the screen's slug in index.html
LINES = {
 "automate": "Automate the follow up. New inquiries answered in seconds, leads qualified and routed, calls booked straight into the calendar.",
 "accelerate": "Accelerate every reply. Common questions answered instantly, email drafts ready to send, and the complicated ones handed to the right person.",
 "your-week": "Your week, minus the busywork. Find the waste. Build the fix. Put it to work. No A.I. theater, and no six month roadmap.",
 "the-rule": "Every build gets judged the same way. Useful, is greater than, impressive.",
 "running-better": "Your business. Running better. Websites, marketing, and A.I. for local business.",
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="bm_george")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "audio"))
    ap.add_argument("--bitrate", default="48k", help="mono opus/mp3 bitrate; speech is fine at 40-56k")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    have_ffmpeg = subprocess.run(["which", "ffmpeg"], capture_output=True).returncode == 0
    total = 0

    for slug, text in LINES.items():
        body = json.dumps({"model": "kokoro", "voice": args.voice, "input": text,
                           "response_format": "mp3", "speed": args.speed}).encode()
        req = urllib.request.Request(KOKORO, data=body,
                                     headers={"Content-Type": "application/json"})
        raw = urllib.request.urlopen(req, timeout=180).read()

        dst = os.path.join(args.out, f"{slug}.mp3")
        if have_ffmpeg:
            tmp = dst + ".tmp.mp3"
            open(tmp, "wb").write(raw)
            # downmix to mono and cut the bitrate — speech needs nothing more
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp,
                            "-ac", "1", "-b:a", args.bitrate, dst], check=True)
            os.remove(tmp)
        else:
            open(dst, "wb").write(raw)

        size = os.path.getsize(dst)
        total += size
        print(f"  {slug + '.mp3':<20} {size//1024:>3} KB  {text[:58]}...")

    print(f"\n  voice: {args.voice}   files: {len(LINES)}   TOTAL: {total//1024} KB")
    print(f"  written to: {args.out}")

if __name__ == "__main__":
    sys.exit(main())
