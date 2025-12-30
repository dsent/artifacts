# Artifacts Monorepo

This repository hosts multiple small artifacts (games, tools, experiments) with a unified build and deployment process.

## Repository Structure

- `/<artifact-name>/` - Individual artifact directories.
- `.github/workflows/` - Deployment and CI workflows.
- `.github/instructions/` - Language-specific Copilot instructions.
- `docs/` - Repository documentation and setup guides.
- `AGENTS.md` - Root-level AI agent instructions (this file).
- `README.md` - Repository index and overview.

## Artifact Conventions

Each artifact should follow these conventions to ensure compatibility with the monorepo structure:

1. **Entry Point:** The main web entry point must be named `index.html` within the artifact directory.
2. **AI Instructions:** Each artifact should have its own `AGENTS.md` file providing project-specific context. It should reference this root `AGENTS.md`.
3. **Build Process:**
   - If an artifact requires a build step, it must expose it via:
     - `package.json`: `npm run build` (production) and `npm run build:dev` (preview).
     - `pyproject.toml`: `uv run build.py` (expects a `build.py` script).
     - `build.ps1`: PowerShell script for custom build logic.
   - Build output must be placed in a `dist/` directory within the artifact folder.
   - If no build step is present, the deployment workflow will copy the artifact's source files to the global `dist/` directory.
4. **Dependencies:** Use `package.json` for Node.js/JS and `pyproject.toml` (with `uv`) for Python.

## Coding Standards

- **General:**
  - Use meaningful variable and function names.
  - Document complex logic with comments.
  - Follow the Single Responsibility Principle.
- **JavaScript:**
  - Use ES6+ syntax (let/const, arrow functions, classes).
  - Use ES modules (import/export).
  - Prefer vanilla JS unless a framework is explicitly required.
- **Python:**
  - Use `uv` for environment and dependency management.
  - Follow PEP 8 style guidelines.

## Deployment Workflow

- **Main Branch:** Pushes to `main` trigger a preview deployment to Cloudflare Pages (auto-generated URLs).
- **Prod Branch:** Pushes to `prod` trigger a production deployment to `artifacts.dsent.me`.
- **Build Process:** The GitHub Actions workflow iterates through all artifacts, runs their build commands (if any), and collects all outputs into a root `dist/` folder for deployment.

## AI Agent Instructions

- Refer to `.github/copilot-instructions.md` for GitHub Copilot specific settings.
- Refer to `.github/instructions/*.instructions.md` for language-specific rules.
- Artifact-level `AGENTS.md` files should be the primary source of truth for project-specific logic.
