#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-recovery/site/11para11.pt}"
DEST_ROOT="${2:-site-clean}"
APP_SOURCE_ROOT="${3:-app}"
DEST_PARENT="$(dirname "$DEST_ROOT")"
DEST_BASENAME="$(basename "$DEST_ROOT")"
BUILD_STAMP="$(date +%Y%m%d-%H%M%S)"
TMP_DEST="$DEST_PARENT/.${DEST_BASENAME}.build-$BUILD_STAMP-$$"

mkdir -p "$DEST_PARENT"

./scripts/migrate_flat_urls.sh "$SRC_ROOT" "$TMP_DEST" "$TMP_DEST/route-manifest.tsv"
./scripts/normalize_wayback_html.sh "$TMP_DEST"
./scripts/rewrite_legacy_links.sh "$TMP_DEST"
./scripts/ensure_placeholders.sh "$TMP_DEST"
./scripts/replace_missing_media_refs.sh "$TMP_DEST"
./scripts/build_articles_index.sh "$TMP_DEST"
./scripts/inject_editorial_theme.sh "$TMP_DEST"

if [[ ! -d "$APP_SOURCE_ROOT" ]]; then
  echo "App source folder not found: $APP_SOURCE_ROOT" >&2
  exit 1
fi
mkdir -p "$TMP_DEST/app"
cp -R "$APP_SOURCE_ROOT"/. "$TMP_DEST/app/"
echo "Synced app source into build: $APP_SOURCE_ROOT -> $TMP_DEST/app"

if [[ -e "$DEST_ROOT" ]]; then
  BACKUP_DEST="${DEST_ROOT}.backup-$BUILD_STAMP"
  mv "$DEST_ROOT" "$BACKUP_DEST"
  echo "Previous build preserved at: $BACKUP_DEST"
fi

mv "$TMP_DEST" "$DEST_ROOT"
echo "Build complete: $DEST_ROOT"
