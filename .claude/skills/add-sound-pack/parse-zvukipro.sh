#!/usr/bin/env bash
# Разбирает страницу zvukipro.com со звуками и печатает строки «N<TAB>id<TAB>название».
# N — порядковый номер звука на странице (с 1), id — параметр ссылки ?do=download&id=.
# Использование: parse-zvukipro.sh <url страницы>
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "использование: $0 <url страницы zvukipro.com>" >&2
  exit 2
fi

html=$(curl -sfL -A "Mozilla/5.0" "$1")

out=$(printf '%s' "$html" | perl -0777 -ne '
  my $n = 0;
  # каждый звук: Название<br><!--dle_audio_begin:...--> ... do=download&id=NNN
  # (перед первым звуком стоит <div class="makarona">, перед остальными <br><br>)
  while (/([^<>]*)<br><!--dle_audio_begin:[^>]*?-->.*?do=download&(?:amp;)?id=(\d+)/gs) {
    my ($title, $id) = ($1, $2);
    $title =~ s/<[^>]+>//g;
    $title =~ s/&quot;/"/g;
    $title =~ s/&amp;/&/g;
    $title =~ s/\s+/ /g;
    $title =~ s/^ | $//g;
    printf "%d\t%s\t%s\n", ++$n, $id, $title;
  }
')

if [ -z "$out" ]; then
  echo "на странице не найдено ни одного звука: $1" >&2
  exit 1
fi

printf '%s\n' "$out"
