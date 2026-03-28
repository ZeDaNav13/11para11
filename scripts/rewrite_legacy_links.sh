#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-site-clean}"

if [[ ! -d "$ROOT" ]]; then
  echo "Folder not found: $ROOT" >&2
  exit 1
fi

while IFS= read -r file; do
  perl -0777 -i -pe '
    # Explicit legacy exceptions found in archived content.
    s{/o-fantasista/o-jogo-do-titulo-04-06-2013(?:#[^"\x27<\s]*)?}{/o-fantasista/2013-04-06-o-jogo-do-titulo.html}gi;
    s{/a-seleccao/o-paradoxo-tacuara-01-03-2013(?:#[^"\x27<\s]*)?}{/a-seleccao/2013-01-03-o-paradoxo-tacuara.html}gi;

    # /section/title-dd-mm-yyyy -> /section/yyyy-mm-dd-title.html
    s{/( [a-z0-9-]+ )/( [a-z0-9-]+ )-([0-3][0-9])-([0-1][0-9])-([12][0-9]{3})(?=[#"\x27<\s])}
     {"/" . $1 . "/" . $5 . "-" . $4 . "-" . $3 . "-" . $2 . ".html"}gexi;
  ' "$file"
done < <(find "$ROOT" -type f -name "*.html" ! -path "$ROOT/app/*" | sort)

echo "Rewrote legacy internal links under: $ROOT"
