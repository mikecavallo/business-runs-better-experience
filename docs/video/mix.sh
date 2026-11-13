#!/bin/bash
# mix.sh VIDEO_ONLY.mp4 WORK_DIR OUT.mp4
# Lays each voiceover line (vo/NN.mp3) at its start time from timeline.json, ducks the music
# under the voice, adds the sound effects and levels the result to about -14 LUFS.
# WORK_DIR must hold music.wav and sfx.wav (from synth.py).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; VID="$1"; WORK="$2"; OUT="$3"; MUS="${MUSIC_GAIN:-0.85}"
read -r DUR STARTS < <(python3 -c "import json;t=json.load(open('$HERE/timeline.json'));print(t['duration'],' '.join(str(int(s*1000)) for s in t['starts']))")
IN=(); FC=""; LAB=""; i=0
for ms in $STARTS; do
  IN+=(-i "$HERE/vo/$(printf %02d $i).mp3")
  FC+="[$i:a]aresample=48000,aformat=channel_layouts=mono,adelay=$ms[v$i];"; LAB+="[v$i]"; i=$((i+1))
done
ffmpeg -y -loglevel error "${IN[@]}" -filter_complex "${FC}${LAB}amix=inputs=$i:normalize=0,acompressor=threshold=0.08:ratio=3:attack=4:release=120,volume=10dB,alimiter=limit=0.9:attack=2:release=60:level=disabled,apad=whole_dur=$DUR" -t "$DUR" "$WORK/vo.wav"
FC="[0:a]asplit=2[vo][vosc];[vo]aformat=channel_layouts=stereo[vos];
[1:a]aresample=48000,volume=$MUS[mus];[mus][vosc]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=450[musd];
[2:a]aresample=48000,volume=0.75,aformat=channel_layouts=stereo[sfx];
[vos][musd][sfx]amix=inputs=3:normalize=0:duration=first"
ffmpeg -y -loglevel error -i "$WORK/vo.wav" -i "$WORK/music.wav" -i "$WORK/sfx.wav" -filter_complex "$FC[m]" -map "[m]" -t "$DUR" "$WORK/_mix.wav"
I=$(ffmpeg -hide_banner -i "$WORK/_mix.wav" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(-14.0 - ($I))")
ffmpeg -y -loglevel error -i "$VID" -i "$WORK/_mix.wav" -filter_complex "[1:a]volume=${G}dB,alimiter=limit=0.62:attack=2:release=80:level=disabled[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t "$DUR" -movflags +faststart "$OUT"
rm "$WORK/_mix.wav"
echo "$OUT  gain ${G} dB"; ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
