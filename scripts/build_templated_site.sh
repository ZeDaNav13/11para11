#!/usr/bin/env bash
set -euo pipefail

INPUT_ROOT="${1:-site-clean}"
OUTPUT_ROOT="${2:-site-templated}"
CONTENT_ROOT="${3:-content}"

node ./scripts/build_templated_site.mjs "$INPUT_ROOT" "$OUTPUT_ROOT" "./templates" "$CONTENT_ROOT"
echo "Templated output ready: $OUTPUT_ROOT"
