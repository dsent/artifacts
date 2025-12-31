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

  // Mobile/Touch detection and setup
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);

  const touchControls = document.getElementById("touchControls");
  if (isMobile && touchControls) {
    touchControls.classList.remove("hidden");
    // Initially hide touch controls (will show when game starts)
    touchControls.style.visibility = 'hidden';

    // Initialize touch controls in input handler
    inputHandler.initTouchControls({
      jumpBtn: document.getElementById("touchJumpBtn"),
      sabotageBtn: document.getElementById("touchSabotageBtn"),
      pauseBtn: document.getElementById("touchPauseBtn"),
      joystick: document.getElementById("touchJoystick"),
      indicator: document.querySelector(".joystick-indicator"),
    });
  }

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
      document.getElementById("finalLines").textContent = game.stats.linesCleared;
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

  // Responsive canvas sizing (after game is initialized)
  function resizeCanvas() {
    if (isMobile) {
      // Touch control dimensions - balanced with top margin for equal spacing
      const touchControlHeight = Math.max(window.innerHeight * 0.165, 135);
      const topMargin = 0; // Handled by CSS padding on container
      
      // Try to reserve space for touch controls first
      let availableHeight = window.innerHeight - touchControlHeight - topMargin - (window.innerHeight * 0.015); // Account for top padding
      let availableWidth = window.innerWidth;

      // Maintain 10:20 aspect ratio (width:height = 1:2)
      const aspectRatio = 1 / 2;
      let newWidth, newHeight;

      if (availableWidth / availableHeight > aspectRatio) {
        // Height is the limiting factor
        newHeight = availableHeight;
        newWidth = newHeight * aspectRatio;
      } else {
        // Width is the limiting factor  
        newWidth = availableWidth;
        newHeight = newWidth / aspectRatio;
      }
      
      // If the canvas would be too small (less than 300px height), allow overlay
      if (newHeight < 300) {
        availableHeight = window.innerHeight - topMargin;
        if (availableWidth / availableHeight > aspectRatio) {
          newHeight = availableHeight;
          newWidth = newHeight * aspectRatio;
        } else {
          newWidth = availableWidth;
          newHeight = newWidth / aspectRatio;
        }
      }

      CANVAS.width = newWidth;
      CANVAS.height = newHeight;

      // Also set CSS dimensions explicitly for proper display
      CANVAS.style.width = newWidth + "px";
      CANVAS.style.height = newHeight + "px";

      // Update renderer and game engine with new dimensions
      renderer.width = newWidth;
      renderer.height = newHeight;
      game.width = newWidth;
      game.height = newHeight;
      // Recalculate constants based on new dimensions
      game.constants.CELL_SIZE = newHeight / game.constants.ROWS;
      game.constants.PLAYER_WIDTH = game.constants.CELL_SIZE * game.constants.PLAYER_WIDTH_RATIO;
      game.constants.PLAYER_HEIGHT = game.constants.CELL_SIZE * game.constants.PLAYER_HEIGHT_RATIO;
    }
  }

  // Handle window resize
  if (isMobile) {
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", () => {
      setTimeout(resizeCanvas, 100); // Delay to ensure viewport has updated
    });
    // Initial resize
    resizeCanvas();
  }

  // --- UI FUNCTIONS ---

  function updateUI() {
    if (!game.player) return;
    const hPct = Math.max(0, Math.floor((1 - game.player.y / CANVAS.height) * 100));
    document.getElementById("height").textContent = hPct;
    document.getElementById("time").textContent = Math.floor(game.stats.time);
    document.getElementById("lines").textContent = game.stats.linesCleared;

    // Update sabotage UI (desktop)
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

    // Update mobile touch sabotage button
    const touchSabotageBtn = document.getElementById("touchSabotageBtn");
    if (touchSabotageBtn) {
      const cooldownBar = touchSabotageBtn.querySelector(".sabotage-cooldown-bar");
      if (game.timers.sabotageCooldown > 0) {
        const cooldownDuration = game.constants.SABOTAGE_COOLDOWN || 3000;
        const percentage = (game.timers.sabotageCooldown / cooldownDuration) * 100;
        if (cooldownBar) {
          cooldownBar.style.width = `${percentage}%`;
        }
        touchSabotageBtn.classList.remove("ready");
        touchSabotageBtn.classList.add("disabled");
      } else {
        if (cooldownBar) {
          cooldownBar.style.width = "0%";
        }
        touchSabotageBtn.classList.remove("disabled");
        touchSabotageBtn.classList.add("ready");
      }
    }

    // Update pause overlay stats (for mobile)
    const pauseHeight = document.getElementById("pauseHeight");
    const pauseTime = document.getElementById("pauseTime");
    const pauseLines = document.getElementById("pauseLines");
    if (pauseHeight) pauseHeight.textContent = hPct + "%";
    if (pauseTime) pauseTime.textContent = Math.floor(game.stats.time) + "s";
    if (pauseLines) pauseLines.textContent = game.stats.linesCleared;
  }

  // --- CONTROL FUNCTIONS ---

  function startGame() {
    game.start();
    ["startOverlay", "pauseOverlay", "gameOverOverlay", "winOverlay"].forEach((id) =>
      document.getElementById(id).classList.add("hidden")
    );
    // Show touch controls when playing
    if (touchControls && isMobile) {
      touchControls.style.visibility = 'visible';
    }
    // Deactivate snow when playing
    if (snowEffect) {
      snowEffect.setActive(false);
    }
  }

  function pauseGame() {
    if (game.status === "playing") {
      game.status = "paused";
      document.getElementById("pauseOverlay").classList.remove("hidden");
      // Hide touch controls when paused
      if (touchControls && isMobile) {
        touchControls.style.visibility = 'hidden';
      }
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
      // Show touch controls when resuming
      if (touchControls && isMobile) {
        touchControls.style.visibility = 'visible';
      }
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
