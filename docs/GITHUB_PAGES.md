# GitHub Pages Deploy

This repo is configured to deploy with a manual GitHub Actions workflow:

- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger: `workflow_dispatch` (manual)

## One-time setup in GitHub

1. Open repository `Settings` -> `Pages`.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. (Optional but recommended) Set a custom domain if you want root-level URLs.

## Deploy when ready

1. Open `Actions` tab.
2. Select **Deploy to GitHub Pages**.
3. Click **Run workflow**.
4. Wait for `build` and `deploy` jobs to finish.

GitHub will provide the live URL in the deploy job output.

## Important URL note

This site currently uses root-absolute URLs (e.g. `/section/...`).
For project Pages URLs like `https://<user>.github.io/<repo>/`, those links can break.
Use one of these approaches:

- Publish from a user/org Pages root site (`<user>.github.io`), or
- Use a custom domain mapped to repo Pages, or
- Update the build/templates to support a base path.
