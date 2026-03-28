#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

SOURCE_APP_DIR="${1:-app}"

if [[ ! -d "$SOURCE_APP_DIR" ]]; then
  echo "Source app folder not found: $SOURCE_APP_DIR" >&2
  exit 1
fi

echo "[1/4] Checking required backoffice source files..."
required_files=(
  "backoffice-authors.html"
  "backoffice-authors.js"
  "backoffice-articles.html"
  "backoffice-articles.js"
  "backoffice-publish.js"
  "styles.css"
)
for file in "${required_files[@]}"; do
  if [[ ! -f "$SOURCE_APP_DIR/$file" ]]; then
    echo "Missing required file: $SOURCE_APP_DIR/$file" >&2
    exit 1
  fi
done

echo "[2/4] Checking article status/validation/publish hooks..."
node - "$SOURCE_APP_DIR" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const sourceDir = process.argv[2];
const html = fs.readFileSync(path.join(sourceDir, "backoffice-articles.html"), "utf8");
const js = fs.readFileSync(path.join(sourceDir, "backoffice-articles.js"), "utf8");
const authorsHtml = fs.readFileSync(path.join(sourceDir, "backoffice-authors.html"), "utf8");
const authorsJs = fs.readFileSync(path.join(sourceDir, "backoffice-authors.js"), "utf8");

function assertIncludes(text, snippet, label) {
  if (!text.includes(snippet)) {
    throw new Error(`Missing ${label}: ${snippet}`);
  }
}

[
  'id="statusSelect"',
  'id="statusFilter"',
  'id="validateBtn"',
  'id="validationSummary"',
  'id="validationList"',
  'id="publishBtn"',
].forEach((token) => assertIncludes(html, token, "article HTML hook"));

[
  "normalizeStatus(",
  "validateFormDraft(",
  "validateAllDraftsForPublish(",
  "validateArticleRecord(",
  "Publicacao bloqueada:",
  "statusFilterEl.addEventListener",
  "validateBtnEl.addEventListener",
  "publishBtnEl.addEventListener",
  "window.BackofficePublish.publishDrafts",
].forEach((token) => assertIncludes(js, token, "article JS hook"));

['id="publishBtn"'].forEach((token) => assertIncludes(authorsHtml, token, "authors HTML hook"));
["publishBtnEl.addEventListener", "window.BackofficePublish.publishDrafts"].forEach((token) =>
  assertIncludes(authorsJs, token, "authors JS hook"),
);
NODE

echo "[3/4] Checking publish helper direct-write and fallback download paths..."
node - "$SOURCE_APP_DIR" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const sourceDir = process.argv[2];
const helper = fs.readFileSync(path.join(sourceDir, "backoffice-publish.js"), "utf8");

function assertIncludes(text, snippet, label) {
  if (!text.includes(snippet)) {
    throw new Error(`Missing ${label}: ${snippet}`);
  }
}

[
  "window.showDirectoryPicker",
  "writeJsonFile(",
  "downloadJson(",
  "authors.backoffice.json",
  "articles.backoffice.json",
  "BackofficePublish",
].forEach((token) => assertIncludes(helper, token, "publish helper hook"));
NODE

echo "[4/4] Checking generated app parity (if generated outputs exist)..."
if [[ -d "site-clean/app" ]]; then
  diff -rq "$SOURCE_APP_DIR" "site-clean/app" > /dev/null
  echo "Parity OK: $SOURCE_APP_DIR == site-clean/app"
else
  echo "Skipping parity check for site-clean/app (not generated yet)."
fi

if [[ -d "site-templated/app" ]]; then
  diff -rq "$SOURCE_APP_DIR" "site-templated/app" > /dev/null
  echo "Parity OK: $SOURCE_APP_DIR == site-templated/app"
else
  echo "Skipping parity check for site-templated/app (not generated yet)."
fi

echo "Backoffice smoke checks passed."
