#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-site-clean}"
REPORT_DIR="${2:-$ROOT/reports}"
REPORT_FILE="$REPORT_DIR/quality-report.md"
TMP_DIR="$(mktemp -d)"
SITE_BASE_PATH="${SITE_BASE_PATH:-}"

if [[ -n "$SITE_BASE_PATH" && "$SITE_BASE_PATH" != "/" ]]; then
  SITE_BASE_PATH="/${SITE_BASE_PATH#/}"
  SITE_BASE_PATH="${SITE_BASE_PATH%/}"
else
  SITE_BASE_PATH=""
fi

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [[ ! -d "$ROOT" ]]; then
  echo "Folder not found: $ROOT" >&2
  exit 1
fi

mkdir -p "$REPORT_DIR"

all_refs="$TMP_DIR/all_refs.tsv"
missing_refs="$TMP_DIR/missing_refs.tsv"
missing_covers="$TMP_DIR/missing_covers.tsv"

: > "$all_refs"
: > "$missing_refs"
: > "$missing_covers"

while IFS= read -r file; do
  perl -0777 -ne '
    while (/(?:href|src|data-content-path)="([^"]+)"/g) {
      print "$1\n";
    }
  ' "$file" | while IFS= read -r ref; do
    printf "%s\t%s\n" "$file" "$ref" >> "$all_refs"
  done
done < <(find "$ROOT" -type f -name "*.html" | sort)

# Check local internal refs.
while IFS=$'\t' read -r file ref; do
  if [[ ! "$ref" =~ ^/ ]]; then
    continue
  fi
  if [[ "$ref" =~ ^// ]]; then
    continue
  fi
  if [[ "$ref" =~ ^/(cdn-cgi|mailto:|javascript:) ]]; then
    continue
  fi

  path="${ref%%#*}"
  path="${path%%\?*}"
  if [[ -n "$SITE_BASE_PATH" && "$path" == "$SITE_BASE_PATH/"* ]]; then
    path="/${path#"$SITE_BASE_PATH"/}"
  fi
  full="$ROOT$path"

  if [[ -f "$full" || -d "$full" || -f "$full/index.html" ]]; then
    continue
  fi

  printf "%s\t%s\n" "$file" "$ref" >> "$missing_refs"
done < "$all_refs"

# Check cover files from articles index.
if [[ -f "$ROOT/data/articles.tsv" ]]; then
  awk -F '\t' 'NR>1 {print $4 "\t" $7}' "$ROOT/data/articles.tsv" \
    | while IFS=$'\t' read -r url cover; do
      [[ -z "$cover" ]] && continue
      path="${cover%%#*}"
      path="${path%%\?*}"
      [[ ! "$path" =~ ^/ ]] && continue
      if [[ -n "$SITE_BASE_PATH" && "$path" == "$SITE_BASE_PATH/"* ]]; then
        path="/${path#"$SITE_BASE_PATH"/}"
      fi
      full="$ROOT$path"
      if [[ ! -f "$full" ]]; then
        printf "%s\t%s\n" "$url" "$cover" >> "$missing_covers"
      fi
    done
fi

missing_ref_count="$(wc -l < "$missing_refs" | tr -d ' ')"
missing_cover_count="$(wc -l < "$missing_covers" | tr -d ' ')"

set +o pipefail
{
  echo "# Site Quality Report"
  echo
  echo "- Root: \`$ROOT\`"
  echo "- Missing internal refs: **$missing_ref_count**"
  echo "- Missing cover files: **$missing_cover_count**"
  echo

  echo "## Top Missing Internal Refs"
  if [[ "$missing_ref_count" -eq 0 ]]; then
    echo
    echo "_None._"
  else
    echo
    echo "| Count | Ref |"
    echo "|---:|---|"
    awk -F '\t' '{print $2}' "$missing_refs" \
      | sort | uniq -c | sort -nr | head -n 30 \
      | awk '{c=$1; $1=""; sub(/^ /,""); printf("| %s | `%s` |\n", c, $0)}'
  fi

  echo
  echo "## Sample Missing Internal Refs (File -> Ref)"
  if [[ "$missing_ref_count" -eq 0 ]]; then
    echo
    echo "_None._"
  else
    echo
    echo "| File | Ref |"
    echo "|---|---|"
    head -n 40 "$missing_refs" \
      | awk -F '\t' '{printf("| `%s` | `%s` |\n", $1, $2)}'
  fi

  echo
  echo "## Sample Missing Covers (Article URL -> Cover)"
  if [[ "$missing_cover_count" -eq 0 ]]; then
    echo
    echo "_None._"
  else
    echo
    echo "| Article | Cover |"
    echo "|---|---|"
    head -n 40 "$missing_covers" \
      | awk -F '\t' '{printf("| `%s` | `%s` |\n", $1, $2)}'
  fi
} > "$REPORT_FILE"
set -o pipefail

echo "Wrote: $REPORT_FILE"
