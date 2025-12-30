---
applyTo: "**/*.js"
---

# JavaScript Coding Standards

## General Principles

- Use ES6+ syntax (let/const, arrow functions, classes, template literals).
- Use ES modules (import/export) for all files.
- Maintain a clean and modular code structure.
- Use meaningful variable and function names.
- Document functions with JSDoc where appropriate.

## Module System

- All JS files should be ES modules.
- Use named exports unless a default export is specifically required by a framework.
- Ensure all imports include the file extension (e.g., `import { foo } from './foo.js';`).

## Style Guidelines

- Indentation: 2 spaces.
- Semicolons: Use them consistently.
- Quotes: Prefer single quotes unless double quotes are necessary.
- Trailing commas: Use them in multi-line arrays and objects.

## Testing

- Prefer vanilla JS for testing logic where possible.
- If a testing framework is used, follow its specific conventions.
