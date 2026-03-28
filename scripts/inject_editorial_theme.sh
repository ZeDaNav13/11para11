#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-site-clean}"

if [[ ! -d "$ROOT" ]]; then
  echo "Folder not found: $ROOT" >&2
  exit 1
fi

while IFS= read -r file; do
  perl -0777 -i -pe '
    if ($_ !~ /editorial-theme\.css/) {
      s{</head>}{<link rel="stylesheet" href="/app/editorial-theme.css">\n</head>}i;
    }
    if ($_ !~ /editorial-theme\.js/) {
      s{</body>}{<script src="/app/editorial-theme.js" defer></script>\n</body>}i;
    }
  ' "$file"
done < <(find "$ROOT" -type f -name "*.html" ! -path "$ROOT/app/*" | sort)

echo "Injected editorial theme assets into HTML files under: $ROOT"
