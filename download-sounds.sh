#!/usr/bin/env bash
# Скачивает звуки Warcraft III с zvukipro.com в sounds/w<N>.mp3.
# N — номер звука в списке на странице; те же номера использует hooks/register.tsx.
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p sounds

PAGE="https://zvukipro.com/games/2214-zvuki-iz-igry-warcraft-3.html"
BASE="https://zvukipro.com/?do=download&id="

# номер:id
SOUNDS="1:41374 2:41375 3:44972 4:41376 5:60066 6:41377 7:41378 8:41379 9:41380 10:41381
11:41382 12:41383 13:41384 14:41385 15:41386 16:41387 17:41388 18:41389 19:41390 21:41392
22:41393 23:41394 24:41395 25:44024 26:41396 27:41397 28:41398 29:41399 30:41400 31:41401
32:41402 33:41403 34:73084 35:41404 36:60065 37:41405 38:41406 39:41407 40:41408 42:41410
43:41411 45:41413 46:48455 47:55590 48:56578 49:56327 50:56325 51:60068 52:56326 53:58711
54:58712 55:59031 56:60067 57:60069 58:60070 59:78983 60:78984 61:78985"

ok=0; failed=0
for pair in $SOUNDS; do
  n=${pair%%:*}; id=${pair##*:}
  out="sounds/w$n.mp3"

  if [ -s "$out" ]; then ok=$((ok + 1)); continue; fi

  curl -sfL -A "Mozilla/5.0" -e "$PAGE" -o "$out" "$BASE$id" || true

  if [ -s "$out" ] && file "$out" | grep -q -E "Audio|MPEG"; then
    ok=$((ok + 1))
  else
    rm -f "$out"; failed=$((failed + 1)); echo "не скачался: w$n (id $id)" >&2
  fi
  sleep 0.3
done

echo "готово: $ok, ошибок: $failed"
[ "$failed" -eq 0 ]
