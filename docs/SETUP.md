# Setup Guide

This guide explains how to set up the Artifacts Monorepo for deployment to Cloudflare Pages.

It explains the process for the original repo ([dsent/artifacts](https://github.com/dsent/artifacts) → [artifacts.dsent.me](https://artifacts.dsent.me)).

If you are forking this repo, adjust domain names and settings accordingly.

## 1. Cloudflare Pages Setup

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Click on the `+` button at the top right corner.
3. Select **Pages** > **Drag and drop your files** > **Get started**.
4. Name your project `artifacts`.
5. Upload the `setup/index.html` file (or the entire `setup/` folder) to initialize the project.
6. Connect a custom domain (`artifacts.dsent.me`).

## 2. GitHub Secrets

You need to add the following secrets to your GitHub repository (**Settings** > **Secrets and variables** > **Actions**):

- `CLOUDFLARE_API_TOKEN`: A Cloudflare API token with `Cloudflare Pages: Edit` permissions.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found on the dashboard overview page).

## 3. Main Site Redirects

To serve artifacts from `dsent.me/artifacts/*`, set up a redirect rule in Cloudflare for your main domain (`dsent.me`):

1. Go to **Rules** > **Redirect Rules**.
2. Create a new rule:
   - **Name:** Redirect Artifacts
   - **Field:** URI Path
   - **Operator:** starts with
   - **Value:** `/artifacts/`
   - **Type:** Dynamic
   - **Expression:** `concat("https://artifacts.dsent.me", substring(http.request.uri.path, 11))`
   - **Status Code:** 301

*Note: The `substring(..., 11)` strips `/artifacts/` (11 characters) from the path.*

## 4. Adding New Artifacts

Follow the [monorepo conventions](../AGENTS.md) when adding new artifacts. All artifacts must be placed within the `artifacts/` directory.

### Required Files

- `index.html`: The main entry point.
- `AGENTS.md`: Project-specific AI instructions (must reference the root `AGENTS.md`).
- `README.md`: Project documentation.
- `LICENSE`: (Recommended) Project-specific license.

### Build Convention Summary

The deployment workflow automatically detects and runs build scripts:

- **Node.js:** `package.json` with a `build` script.
- **Python:** `pyproject.toml` with a `build.py` script (run via `uv`).
- **Custom:** `build.ps1` PowerShell script.
- **Static:** If no build script is found, all files in the artifact directory are copied to `dist/`.

### Example `build.py` (Python)

```python
import os
import shutil

def build():
    os.makedirs("dist", exist_ok=True)
    # Your build logic here (e.g., transpiling, minifying)
    shutil.copy("src/index.html", "dist/index.html")

if __name__ == "__main__":
    build()
```

## 5. Branching Strategy

- `main`: Development branch. Pushes trigger preview deployments.
- `prod`: Production branch. Pushes trigger production deployments.
- Use task-based branches for features and merge them into `main` via PRs. Merge `main` into `prod` when ready for release.
