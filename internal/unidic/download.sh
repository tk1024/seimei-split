#!/usr/bin/env bash
# Download the UniDic lexicon named by internal/unidic/VERSION.
# Only lex.csv is kept, and an up-to-date copy is not downloaded again.
set -euo pipefail

cd "$(dirname "$0")/../.."

version=$(tr -d '[:space:]' < internal/unidic/VERSION)
dest=internal/vendor/unidic/current
stamp="$dest/.version"

if [ -f "$dest/lex.csv" ] && [ "$(cat "$stamp" 2>/dev/null)" = "$version" ]; then
  echo "UniDic $version is already available"
  exit 0
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

url="https://clrd.ninjal.ac.jp/unidic_archive/${version:2}/unidic-cwj-${version}_full.zip"
echo "Downloading $url"
curl -fsSL --retry 3 --retry-delay 5 -o "$tmp/unidic.zip" "$url"

rm -rf "$dest"
mkdir -p "$dest"
unzip -q -o "$tmp/unidic.zip" lex.csv -d "$dest"
echo "$version" > "$stamp"
echo "UniDic $version is ready"
