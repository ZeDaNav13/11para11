# Backoffice Publish Pipeline

This pipeline syncs backoffice draft exports into canonical content used by the site generator.

For full editor workflow (backoffice usage + publish button), see:

- `docs/BACKOFFICE_README.md`

## Draft files

Place exported files in `drafts/`:

- `drafts/articles.backoffice.json`
- `drafts/authors.backoffice.json`

Both files are optional. If neither file exists, publish is skipped.

## Build integration

`./scripts/build.sh` now runs:

1. `build_site_clean`
2. `extract_content_data`
3. `publish_backoffice_drafts`
4. `build_templated_site`
5. `check_site_quality`

Publish always runs after extraction so canonical data can be safely overridden by draft content.

## Validation rules

### Authors

- `name` required
- `slug` required/normalized

### Articles

- `title`, `section_slug`, `date`, `slug`, `url`, `author_slug` required
- `date` must be `YYYY-MM-DD`
- URL must match `/section/yyyy-mm-dd-title.html`
- URL must equal `/${section_slug}/${date}-${slug}.html`
- `author_slug` must exist in canonical or draft authors
- duplicate draft URLs are rejected

## Canonical outputs updated

Publish writes:

- `content/articles.json`
- `content/authors.json`
- `content/sections.json`

## Direct command

```bash
./scripts/publish_backoffice_drafts.sh content drafts
```

## Optional strict mode

You can enable strict validation for published articles (including canonical historical content):

- cover must not be missing or placeholder (`/assets/you.png`)
- body must not be empty/placeholder-only

Using env var:

```bash
PUBLISH_STRICT_PUBLISHED_CONTENT=1 ./scripts/publish_backoffice_drafts.sh content drafts
```

Using third argument:

```bash
./scripts/publish_backoffice_drafts.sh content drafts 1
```
