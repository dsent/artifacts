# Artifacts Monorepo

A collection of small projects, games, and experiments, hosted as a unified monorepo with automated deployment.

## 🚀 Artifacts Index

| Artifact                                           | Description                                                    | Status |
| :------------------------------------------------- | :------------------------------------------------------------- | :----- |
| [Tetromino Escape](./artifacts/tetromino-escape/)  | A browser-based survival game where you dodge falling blocks.  | Live   |

## 🛠️ Development

This repository is organized as a monorepo. Each artifact is contained within the `artifacts/` directory and follows a set of conventions for building and deployment.

### Adding a New Artifact

1. **Create Directory:** Create a new directory for your artifact inside the `artifacts/` folder (e.g., `/artifacts/my-new-project/`).
2. **Entry Point:** Ensure the main web entry point is named `index.html`.
3. **AI Instructions:** Add an `AGENTS.md` file following the [monorepo conventions](./AGENTS.md), and include a backlog file at `.project/backlog.md`; link to it from `README.md` and `AGENTS.md`.
4. **Build Process (Optional):**
    - For Node.js: Add a `package.json` with a `build` script.
    - For Python: Add a `pyproject.toml` and a `build.py` script.
    - For Custom: Add a `build.ps1` PowerShell script.
    - If no build script is found, the source files will be served directly.

### Local Development

To run an artifact locally, you can use any static file server. For example:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx http-server
```

## 🌐 Deployment

- **Preview:** Every push to `main` triggers a preview deployment to Cloudflare Pages.
- **Production:** Pushes to `prod` are deployed to [artifacts.dsent.me](https://artifacts.dsent.me).

For detailed setup and infrastructure information, see [docs/SETUP.md](./docs/SETUP.md).

## 📄 License

The root repository (including build scripts, workflows, and documentation) is licensed under the [MIT License](./LICENSE).

**Important:** Individual artifacts within this monorepo may be licensed under different terms. Please check the `LICENSE` file within each artifact's directory (e.g., `/tetromino-escape/LICENSE`) for its specific licensing information.
