# Backoffice Article System (Step 4)

This step adds article creation and editing in the backoffice UI, connected to the author system.

## Scope delivered

- Article CRUD page: `site-clean/app/backoffice-articles.html`
- Article editor logic: `site-clean/app/backoffice-articles.js`
- Shared UI updates: `site-clean/app/styles.css`
- Navigation links from:
  - `site-clean/app/index.html`
  - `site-clean/app/backoffice-authors.html`

## Core behavior

- Create article drafts with fields:
  - title
  - date
  - section slug
  - author (select)
  - status (`draft`, `review`, `published`)
  - slug
  - description
  - cover URL
  - body HTML
- Edit existing records.
- Delete records.
- Filter/search record list.
- Filter by status.
- Export current records to `articles.backoffice.json`.
- Validation UI before save/publish:
  - URL collision
  - missing cover/body
  - unknown section
  - save/publish blocked on validation errors

## Author selector integration

The article editor loads authors in this priority:

1. Local author drafts from `11para11.backoffice.authors.v1`
2. Canonical extracted data from `/data/authors.json`
3. Fallback default author `11para11`

## Data storage

- Article drafts persist in browser local storage:
  - key: `11para11.backoffice.articles.v1`
- This is a front-end draft layer for now; no server write API yet.

## URL model in editor

URL preview and draft URL follow project route rules:

- With date: `/section/yyyy-mm-dd-title.html`
- Without date: `/section/title.html`

## Next server phase (recommended API)

- `GET /api/articles`
- `GET /api/articles/{id}`
- `POST /api/articles`
- `PUT /api/articles/{id}`
- `DELETE /api/articles/{id}`
