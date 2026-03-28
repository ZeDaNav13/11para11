#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-site-clean}"

if [[ ! -d "$ROOT" ]]; then
  echo "Folder not found: $ROOT" >&2
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

rg -h -o '/system/posts/post_images[^"'"'"'[:space:]]+' "$ROOT" --glob '*.html' \
  | sort -u > "$tmp" || true

while IFS= read -r ref; do
  [[ -z "$ref" ]] && continue
  path="${ref%%#*}"
  path="${path%%\?*}"
  if [[ -f "$ROOT$path" ]]; then
    continue
  fi

  while IFS= read -r file; do
    perl -0777 -i -pe 's/\Q'"$ref"'\E/\/assets\/you.png/g' "$file"
  done < <(rg -l --fixed-strings "$ref" "$ROOT" --glob '*.html')
done < "$tmp"

echo "Replaced missing media refs with /assets/you.png under: $ROOT"
