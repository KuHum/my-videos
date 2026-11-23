#!/usr/bin/env bash
# QA the finished MP4: loudness, black frames, a 15-up contact sheet and sync stills.
set -euo pipefail
cd "$(dirname "$0")/.."
MP4="${1:-renders/single-pastor.mp4}"
echo "=== stream info ==="
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -show_entries format=duration,size -of default=noprint_wrappers=1 "$MP4"

echo "=== loudness ==="
ffmpeg -hide_banner -nostats -i "$MP4" -af ebur128=peak=true -f null - 2>&1 | tail -10

echo "=== black detect (only the final fade may be black) ==="
ffmpeg -hide_banner -nostats -i "$MP4" -vf blackdetect=d=0.08:pix_th=0.10 -an -f null - 2>&1 | grep -i black || echo "no black intervals"

echo "=== contact sheet from the delivered file ==="
rm -f renders/mp4check/*.jpg; mkdir -p renders/mp4check
for t in 1.2 7.0 14.9 19.9 23.9 28.0 34.3 40.5 44.9 50.6 56.8 61.9 64.2 69.0 74.6; do
  ffmpeg -y -hide_banner -loglevel error -ss "$t" -i "$MP4" -frames:v 1 -q:v 2 "renders/mp4check/t${t}.jpg"
done
i=1
rm -f renders/mp4check/s*.jpg
for f in renders/mp4check/t*.jpg; do :; done
for t in 1.2 7.0 14.9 19.9 23.9 28.0 34.3 40.5 44.9 50.6 56.8 61.9 64.2 69.0 74.6; do
  cp "renders/mp4check/t${t}.jpg" "$(printf 'renders/mp4check/s%02d.jpg' $i)"; i=$((i+1))
done
ffmpeg -y -hide_banner -loglevel error -framerate 1 -i renders/mp4check/s%02d.jpg -vf "scale=480:270,tile=5x3:padding=4:margin=4:color=white" -frames:v 1 renders/qa-mp4-sheet.jpg
echo "wrote renders/qa-mp4-sheet.jpg"
