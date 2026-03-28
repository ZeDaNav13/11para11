#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-site-clean}"

if [[ ! -d "$ROOT" ]]; then
  echo "Folder not found: $ROOT" >&2
  exit 1
fi

if [[ -f "$ROOT/assets/you.png" && ! -f "$ROOT/assets/rss_small.png" ]]; then
  cp "$ROOT/assets/you.png" "$ROOT/assets/rss_small.png"
fi

echo "Ensured placeholder assets under: $ROOT/assets"
