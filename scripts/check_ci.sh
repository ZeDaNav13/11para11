#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/2] Running regression checks..."
./scripts/check_regressions.sh

echo "[2/2] Running backoffice smoke checks..."
./scripts/check_backoffice_smoke.sh

echo "CI checks passed."
