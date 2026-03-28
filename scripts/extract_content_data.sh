#!/usr/bin/env bash
set -euo pipefail

INPUT_ROOT="${1:-site-clean}"
OUTPUT_ROOT="${2:-content}"

node ./scripts/extract_content_data.mjs "$INPUT_ROOT" "$OUTPUT_ROOT"
