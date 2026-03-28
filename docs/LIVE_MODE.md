# Live Mode

This mode runs the site from canonical sources without generating `site-clean/`.

## Goal

- Keep day-to-day workflow lean.
- Build and serve from:
  - `content/`
  - `app/`
  - `templates/`
  - static assets from `static/`

## Build

```bash
./scripts/build_live.sh
```

Defaults:

- static source: `static`
- output: `/tmp/11para11-live`
- content: `content`
- app: `app`

Custom:

```bash
./scripts/build_live.sh <static_root> <output_root> <content_root> <app_root>
```

## Serve locally

```bash
./scripts/serve_live.sh
```

Defaults:

- root: `/tmp/11para11-live`
- port: `4173`

## Notes

- `site-clean/` and `site-templated/` are no longer required for live development with this mode.
- `recovery/` is no longer required by live mode once `static/` is present.
