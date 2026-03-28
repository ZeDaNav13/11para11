#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/tmp/11para11-live}"
PORT="${2:-4173}"

if [[ ! -d "$ROOT" ]]; then
  echo "Live output not found: $ROOT" >&2
  echo "Run ./scripts/build_live.sh first." >&2
  exit 1
fi

echo "Serving $ROOT at http://127.0.0.1:$PORT"
cd "$ROOT"
python3 -m http.server "$PORT"
