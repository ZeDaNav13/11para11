#!/usr/bin/env bash
set -euo pipefail

CLEAN_ROOT="${1:-site-clean}"
RECOVERY_ROOT="${2:-recovery/site/11para11.pt}"
SEED_TS="${3:-20170214180859}"

if [[ ! -d "$CLEAN_ROOT" ]]; then
  echo "Clean root not found: $CLEAN_ROOT" >&2
  exit 1
fi
if [[ ! -d "$RECOVERY_ROOT" ]]; then
  echo "Recovery root not found: $RECOVERY_ROOT" >&2
  exit 1
fi

tmp_refs="$(mktemp)"
trap 'rm -f "$tmp_refs"' EXIT

while IFS= read -r file; do
  perl -0777 -ne '
    while (/(?:href|src|data-content-path)="([^"]+)"/g) {
      print "$1\n";
    }
  ' "$file"
done < <(find "$CLEAN_ROOT" -type f -name "*.html" | sort) \
  | rg '^/system/posts/post_images/' \
  | sort -u > "$tmp_refs"

total="$(wc -l < "$tmp_refs" | tr -d ' ')"
ok=0
skip=0
fail=0

while IFS= read -r ref; do
  [[ -z "$ref" ]] && continue
  path="${ref%%\?*}"
  dest="$RECOVERY_ROOT$path"

  if [[ -f "$dest" ]]; then
    skip=$((skip + 1))
    continue
  fi

  mkdir -p "$(dirname "$dest")"
  url="https://web.archive.org/web/${SEED_TS}id_/http://11para11.pt${ref}"
  tmp_out="${dest}.part"

  if curl -L --fail --retry 3 --retry-delay 2 --connect-timeout 10 --max-time 60 "$url" -o "$tmp_out"; then
    mv "$tmp_out" "$dest"
    ok=$((ok + 1))
  else
    rm -f "$tmp_out"
    echo "Failed: $ref" >&2
    fail=$((fail + 1))
  fi
done < "$tmp_refs"

echo "Wayback recovery finished."
echo "Refs found: $total"
echo "Downloaded: $ok"
echo "Already present: $skip"
echo "Failed: $fail"
