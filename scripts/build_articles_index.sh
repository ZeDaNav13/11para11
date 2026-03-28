#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-site-clean}"
OUT_DIR="$ROOT/data"
OUT_FILE="$OUT_DIR/articles.tsv"

if [[ ! -d "$ROOT" ]]; then
  echo "Folder not found: $ROOT" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
printf "date\tsection\tslug\turl\ttitle\tdescription\tcover\n" > "$OUT_FILE"

while IFS= read -r file; do
  rel="${file#"$ROOT/"}"
  section="${rel%%/*}"
  base="$(basename "$file")"
  slug="${base%.html}"
  url="/$section/$base"

  if [[ "$slug" =~ ^([12][0-9]{3}-[01][0-9]-[0-3][0-9])-(.+)$ ]]; then
    date="${BASH_REMATCH[1]}"
  else
    date=""
  fi

  title="$(sed -n 's|.*<title>\(.*\)</title>.*|\1|p' "$file" | head -n 1)"
  description="$(sed -n 's|.*<meta content="\([^"]*\)" name="description".*|\1|p' "$file" | head -n 1)"
  cover="$(sed -n 's|.*<meta content="\([^"]*\)" property="og:image".*|\1|p' "$file" | head -n 1)"
  if [[ -z "$cover" || "$cover" =~ /assets/11_logo\.png || "$cover" =~ /assets/you\.png ]]; then
    cover="$(sed -n 's|.*<img[^>]*src="\([^"]*\)".*|\1|p' "$file" \
      | rg -v '/assets/11_logo\.png|/assets/you\.png|/assets/rss_small\.png' \
      | head -n 1 || true)"
  fi
  if [[ -z "$cover" ]]; then
    cover="/assets/you.png"
  fi
  cover_check="${cover%%#*}"
  cover_check="${cover_check%%\?*}"
  if [[ "$cover_check" =~ ^/ && ! -f "$ROOT$cover_check" ]]; then
    cover="/assets/you.png"
  fi

  title="${title//$'\t'/ }"
  description="${description//$'\t'/ }"
  cover="${cover//$'\t'/ }"
  title="${title//$'\r'/ }"
  description="${description//$'\r'/ }"
  cover="${cover//$'\r'/ }"

  printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
    "$date" "$section" "$slug" "$url" "$title" "$description" "$cover" >> "$OUT_FILE"
done < <(find "$ROOT" -mindepth 2 -maxdepth 2 -type f -name "*.html" ! -name "index.html" ! -path "$ROOT/app/*" | sort)

echo "Wrote: $OUT_FILE"
