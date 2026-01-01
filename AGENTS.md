# Artifacts Monorepo Instructions

## Repository Structure

- `.github/workflows/`: CI/CD.
- `.project/`: Project management (backlogs, etc.).
- `docs/`: Documentation.
- `dist/`: Built artifacts for deployment.
- `setup/`: Github/Cloudflare setup files (companion to SETUP.md).
- `/artifacts/<name>/`: Individual artifact source.

## Artifact Requirements

Each artifact must have its own:

- **Entry Point**: `index.html` in artifact root.
- **Config**: `AGENTS.md` (referencing root) and `.project/backlog.md`.
- **Build** (optional):
  - JS: `package.json` (`npm run build` / `build:dev`).
  - Python: `pyproject.toml` (`uv run build.py`).
  - Custom: `build.ps1`.
- **License**: `LICENSE` file.

## Coding Standards

- **JavaScript**: ES Modules, ES6+, Vanilla JS preferred.
- **Python**: `uv` management, PEP 8.

## Deployment

- **Preview**: Push to `main` -> Cloudflare Pages.
- **Production**: Push to `prod` -> `artifacts.dsent.me`.

## Environment

- **Shell**: PowerShell 7.5 (Integrated). Don't explicitly invoke `pwsh`, just run PS 7.5 commands directly.
