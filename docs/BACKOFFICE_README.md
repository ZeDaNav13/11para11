# Backoffice README

Operational guide for editing authors/articles and publishing drafts into the 11PARA11 build pipeline.

## Backoffice pages

- Authors: `site-templated/app/backoffice-authors.html`
- Articles: `site-templated/app/backoffice-articles.html`

Local source files:

- `app/backoffice-authors.html`
- `app/backoffice-authors.js`
- `app/backoffice-articles.html`
- `app/backoffice-articles.js`
- Shared publish helper: `app/backoffice-publish.js`

Generated copies (do not edit directly):

- `site-clean/app/*`
- `site-templated/app/*`

## Draft data model (browser local storage)

- Authors key: `11para11.backoffice.authors.v1`
- Articles key: `11para11.backoffice.articles.v1`

The backoffice is client-side only (no server API in this phase). Changes are stored in browser `localStorage`.

## Daily workflow

1. Open authors backoffice and create/update authors.
2. Open articles backoffice and create/update articles.
3. Click `Publicar drafts/`.
4. Choose your repository `drafts/` folder in the directory picker.
5. Confirm that both files were written:
   - `drafts/authors.backoffice.json`
   - `drafts/articles.backoffice.json`
6. Run the build:
   - `./scripts/build.sh`

Publish behavior:

- If browser supports File System Access API:
  - writes draft JSON files directly to selected folder.
- If not supported:
  - downloads both JSON files; move them manually into `drafts/`.

## Validation checklist (phased)

### Step 1: End-to-end backoffice publish (active)

Features to validate:

- Author CRUD in backoffice.
- Article CRUD in backoffice.
- `Publicar drafts/` writes or downloads both draft JSON files.
- Build consumes drafts and updates templated site.

How to validate:

1. Open `site-templated/app/backoffice-authors.html`.
2. Create a new author and save.
3. Open `site-templated/app/backoffice-articles.html`.
4. Create a new article for that author and save.
5. Click `Publicar drafts/` and pick repository `drafts/` folder.
6. Confirm files exist:
   - `drafts/authors.backoffice.json`
   - `drafts/articles.backoffice.json`
7. Run `./scripts/build.sh`.
8. Confirm the new article URL exists under `site-templated/<section>/...html`.

### Step 2: Quality gates (deferred for later)

Keep for later in this same file:

- Run `./scripts/check_regressions.sh`
- Run `./scripts/build.sh`
- Review `site-templated/reports/quality-report.md`

### Step 3: Article status workflow (active)

Features to validate:

- Article form supports `status` with values: `draft`, `review`, `published`.
- Article list shows status.
- Article list can filter by status.
- Status persists in local storage and export JSON.

How to validate:

1. Open `site-templated/app/backoffice-articles.html`.
2. Create three articles (or edit existing ones) with statuses:
   - one `draft`
   - one `review`
   - one `published`
3. Use status filter (`todos`, `draft`, `review`, `published`) and confirm list results.
4. Edit one article and change status; save and confirm updated status in list.
5. Click `Exportar JSON` and verify each record contains `status`.

### Step 4: Validation before save/publish (active)

Features to validate:

- `Validar artigo` button shows form validation results.
- Save is blocked when there are validation errors.
- Publish is blocked when any draft has validation errors.
- Required validations:
  - URL collision
  - missing cover
  - missing body HTML
  - unknown section

How to validate:

1. In article form, set a section not present in canonical data and click `Validar artigo`.
2. Leave cover/body empty and click `Validar artigo`.
3. Try to save and confirm save is blocked with validation messages.
4. Create a URL collision with another draft and confirm validation blocks save.
5. With invalid drafts present, click `Publicar drafts/` and confirm publish is blocked.
6. Fix issues, re-validate, then save/publish successfully.

## Build integration

`./scripts/build.sh` executes:

1. `build_site_clean`
2. `extract_content_data`
3. `publish_backoffice_drafts`
4. `build_templated_site`
5. `check_site_quality`

Draft publish merge happens in step 3.

Optional strict mode for step 3:

- set `PUBLISH_STRICT_PUBLISHED_CONTENT=1` to enforce cover/body quality on `published` articles.

## Validation enforced during publish

Authors:

- `name` required
- `slug` required/normalized

Articles:

- required: `title`, `section_slug`, `date`, `slug`, `url`, `author_slug`
- `date` format: `YYYY-MM-DD`
- URL format: `/section/yyyy-mm-dd-title.html`
- URL must match computed value `/${section_slug}/${date}-${slug}.html`
- author must exist in canonical or draft authors
- duplicate draft URLs are rejected

## Regression check

Run:

```bash
./scripts/check_ci.sh
./scripts/check_regressions.sh
./scripts/check_backoffice_smoke.sh
```

Covers:

- zero-article author preservation in publish pipeline
- nested-anchor prevention in generated HTML
- backoffice UX wiring for:
  - status workflow
  - validation flow
  - publish button flow

## Troubleshooting

- `No draft files found under drafts; skipping publish step.`
  - `Publicar drafts/` was not executed, or files were saved in another folder.
- `Unknown author_slug ... in article ...`
  - create/export the author first, then publish articles again.
- URL mismatch error in publish
  - ensure `section_slug`, `date`, `slug`, and `url` align with flat URL rule.
