#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-recovery/site/11para11.pt}"
INTERMEDIATE_ROOT="${2:-site-clean}"
OUTPUT_ROOT="${3:-site-templated}"
CONTENT_ROOT="${4:-content}"
DRAFTS_ROOT="${5:-drafts}"

./scripts/build_site_clean.sh "$SRC_ROOT" "$INTERMEDIATE_ROOT"
./scripts/extract_content_data.sh "$INTERMEDIATE_ROOT" "$CONTENT_ROOT"
bash ./scripts/publish_backoffice_drafts.sh "$CONTENT_ROOT" "$DRAFTS_ROOT"
./scripts/build_templated_site.sh "$INTERMEDIATE_ROOT" "$OUTPUT_ROOT" "$CONTENT_ROOT"
./scripts/check_site_quality.sh "$OUTPUT_ROOT"

echo "Default build complete."
echo "Primary output: $OUTPUT_ROOT"
echo "Quality report: $OUTPUT_ROOT/reports/quality-report.md"
echo "Canonical content: $CONTENT_ROOT"
echo "Drafts source: $DRAFTS_ROOT"
