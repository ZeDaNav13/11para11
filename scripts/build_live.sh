#!/usr/bin/env bash
set -euo pipefail

STATIC_ROOT="${1:-static}"
OUTPUT_ROOT="${2:-/tmp/11para11-live}"
CONTENT_ROOT="${3:-content}"

if [[ ! -d "$STATIC_ROOT" ]]; then
  echo "Static source folder not found: $STATIC_ROOT" >&2
  echo "Expected a self-contained static payload under ./static" >&2
  exit 1
fi
if [[ ! -d "$CONTENT_ROOT" ]]; then
  echo "Content folder not found: $CONTENT_ROOT" >&2
  exit 1
fi
TMP_INPUT="$(mktemp -d /tmp/11para11-live-input.XXXXXX)"
cleanup() {
  rm -rf "$TMP_INPUT"
}
trap cleanup EXIT

rm -rf "$OUTPUT_ROOT"
mkdir -p "$TMP_INPUT"

for item in assets ckeditor_assets system fonts favicon.ico favicon.svg robots.txt; do
  if [[ -e "$STATIC_ROOT/$item" ]]; then
    cp -R "$STATIC_ROOT/$item" "$TMP_INPUT/"
  fi
done

./scripts/build_templated_site.sh "$TMP_INPUT" "$OUTPUT_ROOT" "$CONTENT_ROOT"
./scripts/check_site_quality.sh "$OUTPUT_ROOT"

echo "Live build complete."
echo "Output: $OUTPUT_ROOT"
echo "Quality report: $OUTPUT_ROOT/reports/quality-report.md"
