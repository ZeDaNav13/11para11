#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-site-clean}"

if [[ ! -d "$ROOT" ]]; then
  echo "Folder not found: $ROOT" >&2
  exit 1
fi

while IFS= read -r file; do
  perl -0777 -i -pe '
    # Remove IA-injected playback scripts and styles.
    s{<script[^>]*web-static\.archive\.org/_static/js/bundle-playback\.js[^>]*>\s*</script>\s*}{}gis;
    s{<script[^>]*web-static\.archive\.org/_static/js/wombat\.js[^>]*>\s*</script>\s*}{}gis;
    s{<script[^>]*web-static\.archive\.org/_static/js/ruffle/ruffle\.js[^>]*>\s*</script>\s*}{}gis;
    s{<script>\s*window\.RufflePlayer=.*?</script>\s*}{}gis;
    s{<script[^>]*>\s*__wm\.init\(.*?</script>\s*}{}gis;
    s{<link[^>]*web-static\.archive\.org/_static/css/banner-styles\.css[^>]*>\s*}{}gis;
    s{<link[^>]*web-static\.archive\.org/_static/css/iconochive\.css[^>]*>\s*}{}gis;
    s{<!--\s*End Wayback Rewrite JS Include\s*-->\s*}{}gis;

    # Unwrap archived absolute links for any domain.
    s{https?://web\.archive\.org/web/\d+(?:[a-z_]+)?/(https?://)}{$1}gi;
    s{//web\.archive\.org/web/\d+(?:[a-z_]+)?/(https?://)}{$1}gi;

    # Remove archive wrappers for first-party links (keeps local-root paths).
    s{https?://web\.archive\.org/web/\d+(?:[a-z_]+)?/(?:https?://)?(?:www\.)?11para11\.pt/?}{}gi;
    s{/web/\d+(?:[a-z_]+)?/(?:https?://)?(?:www\.)?11para11\.pt/?}{}gi;
    s{https?://(?:www\.)?11para11\.pt/?}{/}gi;

    # Rewrite old article paths to flat URLs.
    s{/( [a-z0-9-]+ )/( [a-z0-9-]+ )-([0-3][0-9])-([0-1][0-9])-([12][0-9]{3})(?:/index\.html|/)}
     {"/" . $1 . "/" . $5 . "-" . $4 . "-" . $3 . "-" . $2 . ".html"}gexi;
    s{/( [a-z0-9-]+ )/( [a-z0-9-]+ )-([0-3][0-9])-([0-1][0-9])-([12][0-9]{3})(?=["\x27<\s])}
     {"/" . $1 . "/" . $5 . "-" . $4 . "-" . $3 . "-" . $2 . ".html"}gexi;

    # Normalize internal relative URLs to root-relative.
    s{(href|src)=(["\x27])(?!https?://|//|/|#|mailto:|javascript:|data:)([^"\x27]+)\2}{$1=$2/$3$2}gi;

    # Ensure empty first-party paths become root.
    s{(href|src|content)=(["\x27])\2}{$1=$2/$2}gi;
  ' "$file"
done < <(find "$ROOT" -type f -name "*.html" ! -path "$ROOT/app/*" | sort)

echo "Normalization complete: $ROOT"
