#!/usr/bin/env bash
set -euo pipefail

CONTENT_ROOT="${1:-content}"
DRAFTS_ROOT="${2:-drafts}"
STRICT_MODE="${3:-${PUBLISH_STRICT_PUBLISHED_CONTENT:-0}}"

PUBLISH_STRICT_PUBLISHED_CONTENT="$STRICT_MODE" \
  node ./scripts/publish_backoffice_drafts.mjs "$CONTENT_ROOT" "$DRAFTS_ROOT"
