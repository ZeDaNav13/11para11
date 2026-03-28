#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-recovery/site/11para11.pt}"
DEST_ROOT="${2:-site-clean}"
MANIFEST_PATH="${3:-$DEST_ROOT/route-manifest.tsv}"

if [[ ! -d "$SRC_ROOT" ]]; then
  echo "Source folder not found: $SRC_ROOT" >&2
  exit 1
fi

mkdir -p "$DEST_ROOT"
mkdir -p "$(dirname "$MANIFEST_PATH")"

printf "old_path\tnew_path\ttype\n" > "$MANIFEST_PATH"

# Copy root index and selected static assets if present.
for item in index.html assets ckeditor_assets system favicon.ico robots.txt feed; do
  if [[ -e "$SRC_ROOT/$item" ]]; then
    cp -R "$SRC_ROOT/$item" "$DEST_ROOT/"
  fi
done

# Copy section index pages: /section/index.html -> /section/index.html
while IFS= read -r section_index; do
  rel="${section_index#"$SRC_ROOT/"}"
  section="${rel%/index.html}"
  mkdir -p "$DEST_ROOT/$section"
  cp "$section_index" "$DEST_ROOT/$section/index.html"
  printf "/%s/index.html\t/%s/index.html\tsection\n" "$section" "$section" >> "$MANIFEST_PATH"
done < <(find "$SRC_ROOT" -mindepth 2 -maxdepth 2 -type f -name "index.html" | sort)

# Convert article pages: /section/slug/index.html -> /section/yyyy-mm-dd-title.html
while IFS= read -r article_index; do
  rel="${article_index#"$SRC_ROOT/"}"
  section="${rel%%/*}"
  remainder="${rel#*/}"          # slug/index.html
  slug="${remainder%/index.html}"

  if [[ "$slug" =~ ^(.*)-([0-3][0-9])-([0-1][0-9])-([12][0-9]{3})$ ]]; then
    title="${BASH_REMATCH[1]}"
    day="${BASH_REMATCH[2]}"
    month="${BASH_REMATCH[3]}"
    year="${BASH_REMATCH[4]}"
    new_name="${year}-${month}-${day}-${title}.html"
  else
    new_name="${slug}.html"
  fi

  mkdir -p "$DEST_ROOT/$section"
  cp "$article_index" "$DEST_ROOT/$section/$new_name"

  printf "/%s/%s/index.html\t/%s/%s\tarticle\n" \
    "$section" "$slug" "$section" "$new_name" >> "$MANIFEST_PATH"
done < <(find "$SRC_ROOT" -mindepth 3 -maxdepth 3 -type f -name "index.html" | sort)

echo "Migration complete."
echo "Source:   $SRC_ROOT"
echo "Output:   $DEST_ROOT"
echo "Manifest: $MANIFEST_PATH"
