# 11para11 Restoration Plan (Updated 2026-03-28)

This repository now ships as a static archive site, independent from `recovery/`.

## Goals set by AGENT.MD

- Keep all recovered source files intact.
- Rebuild the publication as a living product.
- Add a backoffice to manage articles and authors.
- Use flat article URLs:
  - from: `/section/article-slug/index.html`
  - to: `/section/YYYY-MM-DD-title.html`
- Prioritize mobile-first UX and native-app feel.

## Phase 1 output

- Create a clean output tree in `site-clean/` while preserving recovery files.
- Migrate article pages from the recovered folder format to flat `.html` URLs.
- Produce a route manifest to validate old path -> new path mapping.
- Generate a template-driven production output in `site-templated/` (primary deliverable).

## Current status

- Phase 1 foundation is complete.
- Canonical data layer exists in `content/`:
  - `articles.json`
  - `authors.json`
  - `sections.json`
- Templated output is primary deliverable in `site-templated/`.
- Author system implemented:
  - `/autores/` hub
  - `/autores/{slug}/` author pages
  - article and card linking to author pages
- Backoffice implemented (front-end draft layer):
  - `site-clean/app/backoffice-authors.html`
  - `site-clean/app/backoffice-articles.html`
- Publish pipeline implemented:
  - draft JSON input in `drafts/`
  - merge + validation into canonical `content/` via build
- Live mode implemented:
  - build directly to `/tmp/11para11-live` via `./scripts/build_live.sh`
  - serve via `./scripts/serve_live.sh`
  - documentation in `docs/LIVE_MODE.md`
  - static runtime payload in `static/`
- GitHub Pages deployment ready:
  - `https://zedanav13.github.io/11para11/`
  - project-path base handling is built in (`SITE_BASE_PATH=/11para11`)
- Archive mode decision:
  - content is frozen (no future editorial/backoffice content updates planned)
  - goal is long-term availability/preservation of legacy content

## Default build command

- Run `./scripts/build.sh`
- Pipeline:
  - `site-clean/` (intermediate normalized content)
  - `content/` (canonical JSON data: articles, authors, sections)
  - `publish_backoffice_drafts` merge step (optional if no drafts)
  - `site-templated/` (primary output)
  - quality report at `site-templated/reports/quality-report.md`

## URL conversion rule

For recovered article folder names ending in `-DD-MM-YYYY`:

- old: `/section/title-dd-mm-yyyy/index.html`
- new: `/section/yyyy-mm-dd-title.html`

If no trailing date is detected, keep fallback:

- new: `/section/title.html`

## Next tasks (maintenance only)

1. Keep GitHub Pages workflow green after dependency/platform updates.
2. Optionally run future media optimizations if repository size must be reduced further.
3. Keep `content/` as canonical archival data source (no feature expansion planned).

## Completed in latest session (2026-03-04)

1. Publish button in backoffice UI (`Publicar drafts/`) with direct write/download fallback.
2. Draft status workflow (`draft`, `review`, `published`) with list filtering.
3. Validation UI before save/publish:
   - URL collision
   - missing cover/body
   - unknown section
4. Deterministic `site-clean` build via temp build + swap.
5. Single source of truth for app files at `app/` with sync to `site-clean/app` and `site-templated/app`.
6. Optional strict publish mode for published-content quality (`PUBLISH_STRICT_PUBLISHED_CONTENT=1`).
7. Lightweight smoke test script for backoffice UX:
   - `scripts/check_backoffice_smoke.sh`
8. Compact CI entrypoint:
   - `scripts/check_ci.sh` (runs regressions + backoffice smoke checks)
9. Live mode tooling:
   - `scripts/build_live.sh`
   - `scripts/serve_live.sh`
   - `docs/LIVE_MODE.md`
