#!/bin/bash
# mix.sh MUSIC_GAIN OUT  (inputs in the current folder)
set -e
FC="[1:a]aresample=48000,aformat=channel_layouts=mono,acompressor=threshold=0.08:ratio=3:attack=4:release=120,adelay=300,apad=whole_dur=30,asplit=2[vo][vosc];
[2:a]aresample=48000,volume=$1[mus];
[mus][vosc]sidechaincompress=threshold=0.02:ratio=5:attack=20:release=400[musd];
[3:a]aresample=48000,volume=0.42[sfx];
[vo][musd][sfx]amix=inputs=3:normalize=0:duration=first"
ffmpeg -y -loglevel error -i video-only.mp4 -i voiceover.mp3 -i music.wav -i sfx.wav -filter_complex "$FC[m]" -map "[m]" -t 30 _mix.wav
I=$(ffmpeg -hide_banner -i _mix.wav -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(-13.6 - ($I))")
ffmpeg -y -loglevel error -i video-only.mp4 -i _mix.wav -filter_complex "[1:a]volume=${G}dB,alimiter=limit=0.89:attack=1:release=80:level=disabled,aformat=channel_layouts=stereo[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 30 -movflags +faststart "$2"
rm _mix.wav
echo "$2  gain ${G} dB"; ffmpeg -hide_banner -i "$2" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
