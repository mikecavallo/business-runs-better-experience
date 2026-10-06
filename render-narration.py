#!/usr/bin/env python3
"""
Pre-render the Business Runs Better narration with Kokoro (local, port 8880).

Run this ONLY when the narration copy or the chosen voice changes.
The output is 13 static audio files that ship with the site — the production
server needs no TTS, no Python, and no GPU. Playback is just <audio>.

  python3 render-narration.py --voice bm_george
"""
import argparse, json, os, subprocess, sys, urllib.request

KOKORO = "http://127.0.0.1:8880/v1/audio/speech"

LINES = [
 "Your business. Running better. Practical A.I. for local business.",
 "I find the repetitive work costing you time, then build A.I. into the way your business already runs.",
 "Find the waste. Build the fix. Put it to work. No A.I. theater, and no six month roadmap.",
 "Automate the follow up. New inquiries answered in seconds, leads qualified and routed, calls booked straight into the calendar.",
 "Accelerate every reply. Common questions answered instantly, email drafts ready to send, and the complicated ones handed to the right person.",
 "Eliminate the busywork. Forms and documents read, records updated, calls summarized, and estimates drafted from job notes.",
 "Useful beats impressive. I don't sell A.I. I find the hours your business is losing, and give them back.",
 "How it works. First, find the wasted time. Second, choose the best return. Third, put it to work.",
 "Nine places A.I. can take work off your plate. Leads, customer service, scheduling, estimates, admin, reviews, marketing, team knowledge, and reporting.",
 "What I do. A.I. implementation. Automated lead generation. Web development. A.I. consulting and strategy. M.V.P. development. Customer service and support. Scheduling and admin. Reporting and team knowledge.",
 "Simple pricing. Start with a five hundred dollar time audit, credited to your first build. Builds start at twenty five hundred dollars, fixed price. Ongoing support starts at three hundred a month.",
 "Every build gets judged the same way. Useful, is greater than, impressive.",
 "If you can imagine it, we can build it. Tell me where your business loses time, or what you've been picturing, and I'll come back with a practical next step.",
]

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

    for i, text in enumerate(LINES):
        body = json.dumps({"model": "kokoro", "voice": args.voice, "input": text,
                           "response_format": "mp3", "speed": args.speed}).encode()
        req = urllib.request.Request(KOKORO, data=body,
                                     headers={"Content-Type": "application/json"})
        raw = urllib.request.urlopen(req, timeout=180).read()

        dst = os.path.join(args.out, f"s{i:02d}.mp3")
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
        print(f"  s{i:02d}.mp3  {size//1024:>3} KB  {text[:58]}...")

    print(f"\n  voice: {args.voice}   files: {len(LINES)}   TOTAL: {total//1024} KB")
    print(f"  written to: {args.out}")

if __name__ == "__main__":
    sys.exit(main())
