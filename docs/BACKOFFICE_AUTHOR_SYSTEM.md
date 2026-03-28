# Backoffice Author System (Step 3)

This step defines and implements the first usable author management system for 11PARA11.

## Scope delivered

- Author CRUD UI in `site-clean/app/backoffice-authors.html`.
- Runtime logic in `site-clean/app/backoffice-authors.js`.
- Styling in `site-clean/app/styles.css` (admin blocks).
- Entry point from app feed in `site-clean/app/index.html`.
- Build integration so backoffice is available in `site-templated/app/`.
- Data availability in production output at `site-templated/data/authors.json`.

## Author model (v1)

Fields handled by the backoffice:

- `id`: local record id (string).
- `slug`: stable URL key (`/autores/{slug}/`).
- `name`: display name.
- `bio`: optional short profile.
- `avatar`: optional image URL.
- `article_count`: integer count from canonical extraction.
- `section_slugs`: list of section slugs where the author publishes.

## Data source priority

The backoffice loads data with this order:

1. Local draft data from `localStorage` key `11para11.backoffice.authors.v1`.
2. Canonical generated data from `/data/authors.json`.
3. Fallback derivation from `/data/articles.tsv` (name parsed from title prefix).

## Persistence behavior

- Create/edit/delete operations are persisted locally in browser storage.
- Export button downloads current state as `authors.backoffice.json`.
- No server write endpoint is implemented yet in this phase.

## API contract (next server phase)

These are the recommended endpoints for a real backoffice API:

- `GET /api/authors`
  - Returns list of authors.
- `GET /api/authors/{slug}`
  - Returns one author by slug.
- `POST /api/authors`
  - Creates author.
  - Required: `name`, `slug`.
- `PUT /api/authors/{slug}`
  - Updates author fields.
- `DELETE /api/authors/{slug}`
  - Deletes author if no policy restriction applies.

Recommended response shape:

```json
{
  "slug": "jose-miranda",
  "name": "Jose Miranda",
  "bio": "Editorial profile text",
  "avatar": "/assets/you.png",
  "article_count": 41,
  "section_slugs": ["a-seleccao"],
  "url": "/autores/jose-miranda/"
}
```

## Validation rules

- `slug` unique across authors.
- `slug` normalized to lower-case kebab-case.
- `name` required and <= 120 chars.
- `bio` optional and <= 600 chars.
- `section_slugs` must map to known sections.

