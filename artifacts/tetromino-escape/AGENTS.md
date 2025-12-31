# AGENTS.md — Tetromino Escape

Browser-based survival game: dodge AI-controlled falling Tetromino blocks, climb debris, escape the well.

## Project Brief

- **Purpose:** Arcade survival game combining block-stacking mechanics with platformer gameplay.
- **Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3; Node.js for headless simulations.
- **Reference:** See root [AGENTS.md](../../AGENTS.md) for general repository rules.
- **Backlog:** See `.project/backlog.md` for the current prioritized tasks, bugs, and chores.

## Repo Structure

- `/js/` - Game modules (ES modules with named exports)
  - `config.js` - Exports `DEFAULT_CONSTANTS`, `TETROMINOES`, and `DIFFICULTY_SETTINGS`. Handles layered configuration loading.
  - `utils.js` - Exports `getShape` and `getRandomTetrominoType` utility functions.
  - `input.js` - Exports `InputHandler` class.
  - `renderer.js` - Exports `GameRenderer` class.
  - `ai.js` - Exports `AIController` class with BFS pathfinding and difficulty-based targeting.
  - `engine.js` - Exports `GameEngine` class with core game loop, physics, collision, line clearing.
  - `main.js` - Browser entry point, imports and wires up the game.
- `/css/style.css` - Game styling and overlays.
- `index.html` - Main entry point.
- `simulate.js` - Node.js headless simulation script (ES module).
- `package.json` - Node.js package configuration with `type: "module"`.

## Tools and Commands

- **Run Game:** Serve via HTTP (e.g., `python3 -m http.server 8080`) then open `http://localhost:8080/index.html`.
- **Simulate:** `node simulate.js [difficulty] [games]` (e.g., `node simulate.js hard 100`).
- **State Analysis:** `node simulate.js --state <file.json> [--step n] [--verbose]`

## Game Rules & Logic

- **Grid:** 10 cols × 20 rows; `CELL_SIZE` derived from canvas height.
- **Difficulty:** Settings in `config.js` control AI behavior (targeting, speed, etc.).
- **AI:** Uses BFS pathfinding with weighted scoring (holes, height, wells, cliffs, player avoidance).
- **Player Physics:** Gravity, jump force, terminal velocity defined in `DEFAULT_CONSTANTS`.

## Development Workflow

- **Testing:** Manual browser testing + headless simulations for AI/engine changes.
- **Build:** Currently no build step. Deployment workflow copies source to `dist/`.
- **JS Standards:** Refer to [.github/instructions/javascript.instructions.md](../../.github/instructions/javascript.instructions.md).
