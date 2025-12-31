import { GameEngine } from './engine.js';
import { GameRenderer } from './renderer.js';
import { InputHandler } from './input.js';
import { loadConfig, DIFFICULTY_SETTINGS, DEFAULT_CONSTANTS } from './config.js';
import { isChristmasTheme } from './utils.js';

// Christmas snow effect manager
class SnowEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.snowflakes = [];
    this.active = false;

    if (isChristmasTheme()) {
      this.init();
    }
  }

  init() {
    // Set canvas to full viewport size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Create snowflakes
    for (let i = 0; i < 100; i++) {
      this.snowflakes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 2.5 + 1,
        speed: Math.random() * 0.8 + 0.4,
        drift: Math.random() * 0.6 - 0.3,
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  setActive(active) {
    this.active = active && isChristmasTheme();
  }

  update() {
    if (!this.active || !isChristmasTheme()) return;

    this.snowflakes.forEach(flake => {
      flake.y += flake.speed;
      flake.x += flake.drift;

      // Reset to top when off screen
      if (flake.y > this.canvas.height) {
        flake.y = -10;
        flake.x = Math.random() * this.canvas.width;
      }

      // Wrap horizontally
      if (flake.x > this.canvas.width) {
        flake.x = 0;
      } else if (flake.x < 0) {
        flake.x = this.canvas.width;
      }
    });
  }

  draw() {
    if (!this.active || !isChristmasTheme()) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = DEFAULT_CONSTANTS.CHRISTMAS_SNOW_COLOR;

    this.snowflakes.forEach(flake => {
      this.ctx.beginPath();
      this.ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();

  const CANVAS = document.getElementById("gameCanvas");
  if (!CANVAS) {
    console.error("Canvas element not found. Please ensure the HTML contains an element with id 'gameCanvas'.");
    return;
  }

  const renderer = new GameRenderer(CANVAS);
  const inputHandler = new InputHandler();

  // Initialize snow effect
  const snowCanvas = document.getElementById("snowCanvas");
  const snowEffect = snowCanvas ? new SnowEffect(snowCanvas) : null;

  // Start with snow active (on start screen)
  if (snowEffect) {
    snowEffect.setActive(true);
  }

  // Instantiate the engine
  const game = new GameEngine({
    width: CANVAS.width,
    height: CANVAS.height,
    onGameOver: (reason) => {
      document.getElementById("deathReason").textContent = reason;
      document.getElementById("finalHeight").textContent = Math.floor((1 - game.player.y / CANVAS.height) * 100);
      document.getElementById("finalTime").textContent = Math.floor(game.stats.time);
      document.getElementById("gameOverOverlay").classList.remove("hidden");
      CANVAS.classList.add("death-animation");
      setTimeout(() => CANVAS.classList.remove("death-animation"), 500);
    },
    onGameWin: () => {
      document.getElementById("winTime").textContent = Math.floor(game.stats.time);
      document.getElementById("winOverlay").classList.remove("hidden");
    },
    onLineCleared: (count) => {
      // Optional: Add visual effects for line clear here if not handled by particles
    },
  });

  // Connect Input Handler
  inputHandler.onPause = togglePause;
  inputHandler.onSabotage = () => game.triggerSabotage();
  
  // Debug: Dump state to console and clipboard for use with simulate.js
  inputHandler.onDumpState = () => {
    if (game.status === "playing" || game.status === "paused") {
      const state = game.dumpState();
      console.log("=== GAME STATE DUMP ===");
      console.log(JSON.stringify(state, null, 2));
      console.log("=== Copy the JSON above to use with simulate.js ===");
      // Also copy to clipboard if available
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(JSON.stringify(state, null, 2))
          .then(() => console.log("State copied to clipboard!"))
          .catch(() => console.log("Could not copy to clipboard"));
      }
    }
  };

  // --- UI FUNCTIONS ---

  function updateUI() {
    if (!game.player) return;
    const hPct = Math.max(0, Math.floor((1 - game.player.y / CANVAS.height) * 100));
    document.getElementById("height").textContent = hPct;
    document.getElementById("time").textContent = Math.floor(game.stats.time);
    document.getElementById("lines").textContent = game.stats.linesCleared;

    const sabEl = document.getElementById("sabotage");
    if (sabEl) {
      if (game.timers.sabotageCooldown > 0) {
        sabEl.textContent = Math.ceil(game.timers.sabotageCooldown / 1000) + "s";
        sabEl.style.color = "#888";
      } else {
        sabEl.textContent = "READY";
        sabEl.style.color = "#4ecca3";
      }
    }
  }

  // --- CONTROL FUNCTIONS ---

  function startGame() {
    game.start();
    ["startOverlay", "pauseOverlay", "gameOverOverlay", "winOverlay"].forEach((id) =>
      document.getElementById(id).classList.add("hidden")
    );
    // Deactivate snow when playing
    if (snowEffect) {
      snowEffect.setActive(false);
    }
  }

  function pauseGame() {
    if (game.status === "playing") {
      game.status = "paused";
      document.getElementById("pauseOverlay").classList.remove("hidden");
      // Activate snow when paused
      if (snowEffect) {
        snowEffect.setActive(true);
      }
    }
  }

  function resumeGame() {
    if (game.status === "paused") {
      game.status = "playing";
      document.getElementById("pauseOverlay").classList.add("hidden");
      // Deactivate snow when resuming
      if (snowEffect) {
        snowEffect.setActive(false);
      }
      // Reset lastTime to prevent huge dt jump
      lastTime = performance.now();
    }
  }

  function restartGame() {
    document.getElementById("pauseOverlay").classList.add("hidden");
    startGame();
  }

  function togglePause() {
    if (game.status === "playing") pauseGame();
    else if (game.status === "paused") resumeGame();
  }

  // --- EVENT LISTENERS ---

  // Update line death warning visibility based on difficulty
  function updateLineDeathWarning(diff) {
    const warning = document.getElementById("lineDeathWarning");
    if (warning && DIFFICULTY_SETTINGS[diff]) {
      warning.style.display = DIFFICULTY_SETTINGS[diff].playerCompletesLine ? "flex" : "none";
    }
  }

  // UI Buttons - Difficulty Selection
  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const diff = e.target.dataset.difficulty;
      if (diff) {
        game.selectDifficulty(diff);
        // Update UI buttons
        document.querySelectorAll(".diff-btn").forEach((b) => {
          b.classList.toggle("selected", b.dataset.difficulty === diff);
        });
        // Update line death warning visibility
        updateLineDeathWarning(diff);
      }
    });
  });

  // UI Buttons - Speed Selection
  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const speed = parseFloat(e.target.dataset.speed);
      if (!isNaN(speed)) {
        game.selectSpeed(speed);
        // Update UI buttons
        document.querySelectorAll(".speed-btn").forEach((b) => {
          b.classList.toggle("selected", parseFloat(b.dataset.speed) === speed);
        });
      }
    });
  });

  // UI Buttons - Game Control
  const startBtn = document.getElementById("start-btn");
  if (startBtn) startBtn.addEventListener("click", startGame);

  const resumeBtn = document.getElementById("resume-btn");
  if (resumeBtn) resumeBtn.addEventListener("click", resumeGame);

  const restartBtn = document.getElementById("restart-btn");
  if (restartBtn) restartBtn.addEventListener("click", restartGame);

  const tryAgainBtn = document.getElementById("try-again-btn");
  if (tryAgainBtn) tryAgainBtn.addEventListener("click", startGame);

  const playAgainBtn = document.getElementById("play-again-btn");
  if (playAgainBtn) playAgainBtn.addEventListener("click", startGame);

  // --- MAIN LOOP ---

  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    game.update(dt, inputHandler);
    updateUI();
    renderer.draw(game);

    // Update and draw snow effect
    if (snowEffect) {
      snowEffect.update();
      snowEffect.draw();
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
