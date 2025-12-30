# Artifacts

A collection of small projects, games, and experiments.

## Artifacts Index

| Artifact                                | Description                                                   | Status |
| :-------------------------------------- | :------------------------------------------------------------ | :----- |
| [Tetromino Escape](./tetromino-escape/) | A browser-based survival game where you dodge falling blocks. | Live   |

## Development

This repository is organized as a monorepo. Each artifact is contained within its own directory.

### Adding a New Artifact

1. Create a new directory for your artifact.
2. Add an `index.html` as the entry point.
3. Add an `AGENTS.md` file following the [monorepo conventions](./AGENTS.md).
4. (Optional) Add a build process via `package.json` or `pyproject.toml`.

### Deployment

- **Preview:** Pushes to `main` are deployed to a preview environment.
- **Production:** Pushes to `prod` are deployed to [artifacts.dsent.me](https://artifacts.dsent.me).

For detailed setup instructions, see [docs/SETUP.md](./docs/SETUP.md).

## License

Each artifact may have its own license. See individual directories for details. Root repository is licensed under MIT.
