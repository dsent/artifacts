# Project Backlog (Simplified)

Simple prioritized list. No detailed plans.

## P0

(none)

## P1

- Add sound effects.
- Add background music.
- Bug: Sabotage key not working sometimes.

## P2

- Save settings (difficulty, sound on/off) in local storage.
- Add high score tracking per difficulty.
- Improve visual effects and animations (especially death conditions).

## Completed

- 2026-01-04 (done): Display build date in info panel (bottom right). Loaded from config.json generated during deployment.
- 2026-01-04 (done): AI overhaul (improved algo, avoiding player better, config tweaks)
- 2026-01-04 (done): Bug: Better pushing player aside and squishing (should not get stuck in blocks for good now).
- 2026-01-03 (done): Agent instructions improved in root AGENTS.md. Added: critical thinking (question user claims), approval workflow (propose before acting), decision documentation (`// DECISION:` comments).
- 2026-01-02 (done): Configurable keybindings
- 2026-01-01 (done): Bug: Player gets stuck in blocks when lines are cleared. Fixed by simulating post-clear grid state and preemptively adjusting player position. Crucially, the collision logic for the simulation now exactly matches the game's physics engine (using -1 pixel tolerance instead of epsilon) to prevent false positives where the player is safe but "technically" overlapping a block boundary.
- 2025-12-31 (done): Add mobile support (touch controls, responsive layout).
- 2025-12-31 (done): Add Christmas theme (snow falling from Dec 20 to Jan 10).
- 2025-12-31 (done): Fix starting screen/pause layout (it's ugly now).
- 2025-12-31 (done): Rendering updates: get rid of hardcoded colors, visually indicate sabotaged pieces.
- 2025-12-31 (done): Fix sabotage mechanics - added a separate "sabotage" difficulty setting that actively encourages building debris, heavily penalizes line clearing, and targets the player's danger zone.
- 2025-12-31 (done): Set debug enabled or disabled by deployment scripts (disabled for production, enabled for dev/running locally).
- 2025-12-30 (done): Bug: When switching from hard to other difficulties, an indicator of 'line clear danger' is shown despite those difficulties not having line clear death mechanics.
