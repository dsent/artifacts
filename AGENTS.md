# Artifacts Monorepo Instructions

## Agent Behavior

### Think Critically

- **Question user assumptions.** If a claim seems off, verify it before acting.
- **Don't take user statements at face value.** Check the code, test the behavior, look at context.
- **Push back on bad ideas.** If a proposed change seems wrong or risky, say so and explain why.

### Propose Before Acting

- **For non-trivial changes, explain your plan first.** Don't silently refactor or restructure.
- **Get explicit approval** before: architectural changes, deleting code, changing core logic, adding dependencies.
- **Small, obvious fixes are OK without asking** (typos, formatting, clear bug fixes with obvious solutions).

### Document Decisions

- **Add `// DECISION:` comments** when making non-obvious choices that future agents might question or undo.
- **Explain the "why"**, not just the "what". Bad: `// Use -1 tolerance`. Good: `// DECISION: Use -1px tolerance (not epsilon) to match physics engine collision behavior and prevent false overlaps.`
- **Check existing `DECISION:` comments** before changing related code. Don't undo intentional fixes.
- **Update `.project/backlog.md` Completed section** when finishing tasks, with brief note on approach.

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
