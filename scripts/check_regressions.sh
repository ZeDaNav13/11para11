#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "[1/2] Checking publish pipeline preserves zero-article authors..."
mkdir -p "$TMP_DIR/content" "$TMP_DIR/drafts"

cat > "$TMP_DIR/content/articles.json" <<'JSON'
[]
JSON

cat > "$TMP_DIR/content/authors.json" <<'JSON'
[
  {
    "slug": "existing",
    "name": "Existing",
    "url": "/autores/existing/",
    "article_count": 0,
    "section_count": 0,
    "section_slugs": []
  }
]
JSON

cat > "$TMP_DIR/content/sections.json" <<'JSON'
[]
JSON

cat > "$TMP_DIR/drafts/authors.backoffice.json" <<'JSON'
[
  {
    "name": "New Author",
    "slug": "new-author"
  }
]
JSON

node ./scripts/publish_backoffice_drafts.mjs "$TMP_DIR/content" "$TMP_DIR/drafts" > /dev/null

node -e '
const fs = require("node:fs");
const file = process.argv[1];
const data = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(data) || data.length !== 2) {
  console.error("Expected exactly 2 authors, got:", Array.isArray(data) ? data.length : "invalid");
  process.exit(1);
}
const slugs = new Set(data.map((a) => a.slug));
if (!slugs.has("existing") || !slugs.has("new-author")) {
  console.error("Missing expected author slugs:", [...slugs].join(", "));
  process.exit(1);
}
' "$TMP_DIR/content/authors.json"

echo "[2/2] Checking generated HTML does not contain nested anchors..."
./scripts/build_templated_site.sh "site-clean" "site-templated" "content" > /dev/null

bad_files="$(find "site-templated" -type f -name "*.html" -print0 \
  | xargs -0 perl -0777 -ne 'if (/<a\b[^>]*>(?:(?!<\/a>).)*<a\b/is) { print "$ARGV\n"; }')"

if [[ -n "$bad_files" ]]; then
  echo "Nested anchors detected in generated HTML:"
  echo "$bad_files"
  exit 1
fi

echo "Regression checks passed."
