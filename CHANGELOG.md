# Changelog

## 2026-03-28

### Added
- GitHub Pages project-path deployment support for:
  - `https://zedanav13.github.io/11para11/`
- Self-hosted fonts in `static/fonts` (`Barlow`, `Oswald`), with local `@font-face`.
- Updated favicon assets to enforce white `11` on green background:
  - `static/favicon.svg`
  - `static/favicon.ico`

### Changed
- Pages workflow now builds with:
  - `SITE_BASE_PATH=/11para11`
  - `SITE_URL=https://zedanav13.github.io/11para11`
- Template/build path handling updated so links/assets resolve under `/11para11/`.
- `scripts/build_live.sh` now clears output folder before each build to avoid stale artifacts.
- `scripts/build_live.sh` and `scripts/build_templated_site.mjs` no longer publish `app/` into live output.
- `scripts/check_site_quality.sh` updated for base-path-aware checks and safer report generation.

### Optimized
- Lossless PNG recompression pass over archive media:
  - files processed: `1056`
  - files reduced: `30`
  - bytes saved: `451436`

### Verified
- `./scripts/build_live.sh` succeeds with Pages env settings and generates deploy-ready output.
- GitHub remote configured and `main` pushed to:
  - `https://github.com/ZeDaNav13/11para11`

## 2026-03-05

### Added
- Self-contained static payload for live mode:
  - `static/assets`
  - `static/ckeditor_assets`
  - `static/system`
  - `static/favicon.ico`
  - `static/robots.txt`

### Changed
- `scripts/build_live.sh` now defaults to `static/` instead of `recovery/site/11para11.pt`.
- `docs/LIVE_MODE.md` updated to document `static/` as the runtime static source.

### Verified
- `./scripts/build_live.sh` runs successfully with default arguments (no `recovery/` argument required).
- `./scripts/check_ci.sh` passes.

## 2026-03-04

### Added
- Backoffice smoke test:
  - `scripts/check_backoffice_smoke.sh`
  - validates status workflow hooks
  - validates save/publish validation hooks
  - validates publish button wiring/fallback
  - validates generated app parity with `app/`
- Compact CI entrypoint:
  - `scripts/check_ci.sh`
  - runs `check_regressions` + `check_backoffice_smoke`
- Canonical app source directory:
  - `app/` (single source for backoffice/front-end app files)
- Live mode docs and commands:
  - `docs/LIVE_MODE.md`
  - `scripts/build_live.sh` (builds to `/tmp/11para11-live` by default)
  - `scripts/serve_live.sh` (serves live output locally)

### Changed
- Build pipeline source-of-truth updates:
  - `scripts/build_site_clean.sh` now syncs app files from `app/` into clean build output
  - `scripts/build_templated_site.mjs` now replaces `site-templated/app` from input app folder
- Publish pipeline strict mode:
  - `scripts/publish_backoffice_drafts.mjs` supports `PUBLISH_STRICT_PUBLISHED_CONTENT=1`
  - enforces published article cover/body quality in strict mode
  - `scripts/publish_backoffice_drafts.sh` forwards strict mode via env or third arg
- Docs updated:
  - `docs/BACKOFFICE_PUBLISH_PIPELINE.md`
  - `docs/BACKOFFICE_README.md`
  - `RESTORATION_PLAN.md`
- Runtime workflow can now avoid `site-clean/` and `site-templated/` for day-to-day local runs.

### Verified
- `./scripts/build.sh` executed successfully.
- `./scripts/check_regressions.sh` executed successfully.
- `./scripts/check_backoffice_smoke.sh` executed successfully.
- `./scripts/check_ci.sh` executed successfully.

## 2026-03-01

### Added
- Backoffice publish UX:
  - shared helper `site-clean/app/backoffice-publish.js`
  - `Publicar drafts/` action in authors and articles backoffice pages
  - direct write support via directory picker with download fallback
- Regression script:
  - `scripts/check_regressions.sh`
  - verifies zero-article author preservation
  - verifies no nested anchors in generated HTML
- Backoffice docs:
  - `docs/BACKOFFICE_README.md` (operational workflow + phased validation checklist)
- Article workflow enhancements:
  - draft status field (`draft`, `review`, `published`) in backoffice articles
  - status filter in article list
  - validation UI (`Validar artigo`, summary, error list)

### Changed
- `scripts/publish_backoffice_drafts.mjs` now preserves canonical/draft authors even when `article_count = 0`.
- `scripts/build_templated_site.mjs` card rendering updated to avoid nested anchors.
- `templates/main.css` updated for new card structure in templated output.
- `site-clean/app/backoffice-articles.js` updated with:
  - status persistence/normalization for local and seed records
  - pre-save validation blocking
  - pre-publish validation blocking
  - checks for URL collision, missing cover/body, unknown section
- `site-clean/app/backoffice-articles.html` and `site-clean/app/styles.css` updated for new controls and validation UI.
- Documentation updated:
  - `docs/BACKOFFICE_ARTICLE_SYSTEM.md`
  - `docs/BACKOFFICE_PUBLISH_PIPELINE.md`

### Verified
- `./scripts/build.sh` executed successfully after changes.
- `./scripts/check_regressions.sh` executed successfully.

## 2026-02-26

### Added
- Author system in templated site:
  - author links in cards and article pages
  - author profile pages at `/autores/{slug}/`
  - authors hub page at `/autores/`
- Backoffice UI for author management:
  - create/edit/delete/filter/export
  - local persistence (`localStorage`)
  - bootstrap from canonical data
- Backoffice UI for article management:
  - create/edit/delete/filter/export
  - author selector tied to author system data
  - URL preview using flat URL rules
- Publish pipeline for backoffice drafts:
  - `scripts/publish_backoffice_drafts.mjs`
  - integrated in `./scripts/build.sh`
  - validation of dates, URLs, author references, duplicates
- Project docs:
  - `docs/BACKOFFICE_AUTHOR_SYSTEM.md`
  - `docs/BACKOFFICE_ARTICLE_SYSTEM.md`
  - `docs/BACKOFFICE_PUBLISH_PIPELINE.md`

### Changed
- `scripts/build.sh` now includes publish step after canonical extraction.
- `scripts/build_templated_site.mjs` now copies app/data into templated output and writes `data/authors.json`.
- `scripts/build_articles_index.sh` and `scripts/extract_content_data.mjs` now ignore `app/` in editorial indexing.
- App navigation now links to both backoffice screens.

### Verified
- Full build executed successfully with:
  - `Articles: 399`
  - `Sections: 10`
  - `Authors: 17`
- Quality report generated at `site-templated/reports/quality-report.md`.
