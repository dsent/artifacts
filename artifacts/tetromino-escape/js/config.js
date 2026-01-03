/**
 * Game Configuration and Constants
 *
 * This file contains all game constants and handles layered configuration loading.
 * Priority: URL Parameters > config.json > Hostname Detection > Defaults
 */

export const DEFAULT_CONSTANTS = {
  COLS: 10,
  ROWS: 20,
  GRAVITY: 0.6,
  JUMP_FORCE: -12.5, // Max jump ~3.6 cells (can't climb 4-cell cliffs)
  MOVE_SPEED: 4,
  TERMINAL_VELOCITY: 15,
  SPAWN_DELAY: 0.3, // seconds
  LINE_HISTORY_WINDOW: 10,
  DEBUG_AI: false, // Default to false, resolved in loadConfig()

  // Player dimensions as ratio of cell size
  PLAYER_WIDTH_RATIO: 0.7,
  PLAYER_HEIGHT_RATIO: 1.5,

  // Physics thresholds
  MAX_CLIMBABLE_HEIGHT: 3, // Max rows player can jump up
  CLIFF_HEIGHT_THRESHOLD: 4, // Height difference that creates a cliff
  PIECE_LANDING_TOLERANCE: 4, // Pixels tolerance for landing on piece
  HORIZONTAL_OVERLAP_THRESHOLD: 0.5, // Ratio for horizontal push decision

  // AI Decision Constants
  AI_RETARGET_DISTANCE: 2, // Rows from landing before stopping retargets
  AI_FAST_DROP_HEIGHT: 6, // Minimum height for fast drop check
  AI_PANIC_HEIGHT: 2, // Rows from top that triggers panic mode
  AI_WARNING_HEIGHT: 4, // Rows from top for warning state
  AI_MAX_BFS_ITERATIONS: 4000, // Safety limit for pathfinding

  // Visual/Particle Constants
  PARTICLES_PER_BLOCK: 6,
  PARTICLE_LIFETIME: 1, // seconds
  PARTICLE_DECAY_RATE: 2, // life reduction per second
  PARTICLE_VELOCITY_RANGE: 8, // max velocity in any direction
  SABOTAGE_COLOR: "#ff0033", // Bright red for sabotaged pieces

  // UI Colors
  BACKGROUND_COLOR: "#0a0a15",
  GRID_LINE_COLOR: "rgba(255, 255, 255, 0.05)",
  ESCAPE_ZONE_COLOR: "#4ecca3",
  ESCAPE_ZONE_BG: "rgba(78, 204, 163, 0.15)",

  // Block rendering colors
  BLOCK_HIGHLIGHT_COLOR: "rgba(255, 255, 255, 0.3)",
  BLOCK_SHADOW_COLOR: "rgba(0, 0, 0, 0.3)",
  SABOTAGE_INDICATOR_BG: "#000000",

  // Danger indicator colors
  DANGER_INDICATOR_COLOR: "red",
  DANGER_INDICATOR_ALPHA_BASE: 0.3,
  DANGER_INDICATOR_ALPHA_PULSE: 0.3,

  // Debug overlay colors
  DEBUG_PATH_COLOR: "rgba(0, 255, 255, 0.4)",
  DEBUG_TARGET_FILL: "rgba(255, 255, 0, 0.25)",
  DEBUG_TARGET_STROKE: "rgba(255, 255, 0, 0.8)",
  DEBUG_BG_COLOR: "rgba(0, 0, 0, 0.7)",
  DEBUG_TEXT_COLOR: "#00ff00",

  // Player Colors
  PLAYER_BODY_COLOR: "#4ecca3",
  PLAYER_HEAD_COLOR: "#ffd93d",
  PLAYER_EYES_COLOR: "#1a1a2e",
  PLAYER_LEGS_COLOR: "#e94560",

  // Ground Check Constants
  GROUND_CHECK_WIDTH_RATIO: 0.5, // Center portion of player to check for ground
  GROUND_CHECK_DISTANCE: 1, // Pixels below player to check

  // Christmas Theme Colors
  CHRISTMAS_SNOW_COLOR: "rgba(255, 255, 255, 0.8)",
  CHRISTMAS_HAT_RED: "#c41e3a",
  CHRISTMAS_HAT_WHITE: "#ffffff",
};

// Key Bindings Configuration
export const KEYBINDINGS = {
  // Movement
  MOVE_LEFT: ['ArrowLeft', 'KeyA'],
  MOVE_RIGHT: ['ArrowRight', 'KeyD'],
  JUMP: ['ArrowUp', 'KeyW', 'Space'],
  
  // Game Controls
  PAUSE: ['KeyP', 'Escape'],
  SABOTAGE: ['KeyS'],
  DUMP_STATE: ['F9', 'KeyT'],
  
  // Scroll prevention keys (keys that should preventDefault)
  PREVENT_SCROLL: ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'Space'],
};

export const TETROMINOES = {
  I: { shapes: [[[1, 1, 1, 1]], [[1], [1], [1], [1]]], color: "#00f0f0" },
  O: {
    shapes: [
      [
        [1, 1],
        [1, 1],
      ],
    ],
    color: "#f0f000",
  },
  T: {
    shapes: [
      [
        [0, 1, 0],
        [1, 1, 1],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 0],
      ],
      [
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [0, 1],
      ],
    ],
    color: "#a000f0",
  },
  S: {
    shapes: [
      [
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    ],
    color: "#00f000",
  },
  Z: {
    shapes: [
      [
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1],
        [1, 1],
        [1, 0],
      ],
    ],
    color: "#f00000",
  },
  J: {
    shapes: [
      [
        [1, 0, 0],
        [1, 1, 1],
      ],
      [
        [1, 1],
        [1, 0],
        [1, 0],
      ],
      [
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1],
        [0, 1],
        [1, 1],
      ],
    ],
    color: "#0000f0",
  },
  L: {
    shapes: [
      [
        [0, 0, 1],
        [1, 1, 1],
      ],
      [
        [1, 0],
        [1, 0],
        [1, 1],
      ],
      [
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1],
        [0, 1],
        [0, 1],
      ],
    ],
    color: "#f0a000",
  },
};

export const DIFFICULTY_SETTINGS = {
  easy: {
    id: "easy",
    // Speed and timing
    baseFallTick: 650,
    aiMoveInterval: 200,
    aiSpawnGravityRows: 0, // Use gravity for first N rows after spawn
    aiLandingGravityRows: 5, // Use gravity for last N rows before landing
    aiDangerThreshold: 1, // AI ticks player must stay in danger before retarget
    // Fast drop settings
    spawnDropDelay: 2,
    minFastDropHeight: 6,
    minMovesBeforeFastDrop: 3,
    // Line clearing
    lineReward: 1, // Don't reward line clears much
    // Holes - mild penalties, AI builds debris quickly
    holeReward: -5, // Very mild base penalty
    holeDepthReward: 0, // Don't care about burying holes
    weightedHoleReward: -1, // Slight preference to keep upper rows clean
    rowsWithHolesReward: -5, // Mild penalty for spreading holes
    colTransitionReward: -1, // Minimal fragmentation penalty
    // Height
    heightReward: 0, // Don't penalize height much
    maxHeightReward: 0, // No penalty for max height
    // Bumpiness: don't punish uneven terrain too much
    bumpinessReward: -1,
    // Terrain traversability (funnel-based)
    // Penalty for >=4 height cliffs in valid funnel pattern (scaled by distance from edge)
    funnelPenaltyBase: -30,
    // Prohibitive penalty for cliffs that split the field (break funnel pattern)
    splitPenalty: -1000,
    // Avoiding player
    dangerZoneReward: -500,
    dangerZoneDecay: 1.0, // Never decays - always avoids player
    // Can the player complete lines?
    playerCompletesLine: false,
    lineClearDelay: 800,
    // Sabotage settings
    sabotageDuration: 1.5,
    sabotageCooldown: 5.0,
  },
  normal: {
    id: "normal",
    // Speed and timing
    baseFallTick: 550,
    aiMoveInterval: 100,
    aiSpawnGravityRows: 0, // Use gravity for first N rows after spawn
    aiLandingGravityRows: 4, // Use gravity for last N rows before landing
    aiDangerThreshold: 2, // AI ticks player must stay in danger before retarget
    // Fast drop settings
    spawnDropDelay: 2,
    minFastDropHeight: 4,
    minMovesBeforeFastDrop: 3,
    // Line clearing: slight preference to clear, but not aggressive
    lineReward: 20,
    // Holes: moderate penalties, clears lines but accumulates debris over time
    holeReward: -30, // Moderate base penalty
    holeDepthReward: -1, // Slight penalty for burying holes
    weightedHoleReward: -3, // Moderate preference for clean upper rows
    rowsWithHolesReward: -15, // Moderate penalty for spreading holes
    colTransitionReward: -5, // Moderate fragmentation penalty
    // Height: slight penalty
    heightReward: -2,
    maxHeightReward: -3,
    // Bumpiness: moderate penalty
    bumpinessReward: -10,
    // Terrain traversability (funnel-based)
    funnelPenaltyBase: -20,
    splitPenalty: -500,
    // Avoiding player
    dangerZoneReward: -250,
    dangerZoneDecay: 0.7, // Moderate decay - stops caring after ~3-4 retargets
    // Can the player complete lines?
    playerCompletesLine: false,
    lineClearDelay: 800,
    // Sabotage settings
    sabotageDuration: 1.5,
    sabotageCooldown: 10.0,
  },
  hard: {
    id: "hard",
    // Speed and timing
    baseFallTick: 450,
    aiMoveInterval: 50,
    aiSpawnGravityRows: 0, // Use gravity for first N rows after spawn
    aiLandingGravityRows: 3, // Use gravity for last N rows before landing
    aiDangerThreshold: 4, // AI ticks player must stay in danger before retarget
    // Fast drop settings
    spawnDropDelay: 0,
    minFastDropHeight: 3,
    minMovesBeforeFastDrop: 2,
    // Line clearing: aggressive clearing
    lineReward: 200,
    multiLineBonus: true,
    // Holes: aggressive penalties based on Dellacherie-Thiery research
    holeReward: -80, // Strong base penalty (reduced slightly since we have more metrics)
    holeDepthReward: -2, // Penalize burying holes deeper
    weightedHoleReward: -8, // Upper holes heavily penalized (row 5 = -120, row 17 = -24)
    rowsWithHolesReward: -35, // Heavy penalty for spreading holes across rows
    colTransitionReward: -12, // Strong fragmentation penalty (based on BCTS weight)
    // Height: penalize to keep stack low
    heightReward: -4,
    maxHeightReward: -5,
    // Bumpiness: high penalty for uneven surface
    bumpinessReward: -20,
    // Terrain traversability (funnel-based) - less important on hard
    funnelPenaltyBase: -10,
    splitPenalty: -250,
    // Avoiding player
    dangerZoneReward: -75,
    dangerZoneDecay: 0.4, // Aggressive decay - stops caring after ~2 retargets
    // Can the player complete lines?
    playerCompletesLine: true,
    lineClearDelay: 800,
    // Sabotage settings
    sabotageDuration: 1.5,
    sabotageCooldown: 15.0,
  },
  // Sabotage: NOT user-selectable, only used when sabotaging
  // This difficulty actively tries to make the player's life harder by:
  // - Building up debris (positive rewards for holes, height, bumpiness)
  // - Heavily penalizing line clears
  // - Actively targeting the player's danger zone
  sabotage: {
    id: "sabotage",
    // Line clearing: HEAVILY penalize clearing lines
    lineReward: -500,
    multiLineBonus: false,
    // Holes: REWARD creating holes and burying them
    holeReward: 10, // REWARD creating holes
    holeDepthReward: 5, // REWARD burying holes deeper (harder to clear)
    weightedHoleReward: 2, // Slightly reward upper holes (traps player)
    rowsWithHolesReward: 5, // REWARD spreading holes across rows
    colTransitionReward: 3, // REWARD fragmentation
    // Height: REWARD building high (opposite of normal behavior)
    heightReward: 2,
    maxHeightReward: 5,
    // Bumpiness: REWARD uneven terrain (makes it harder for player)
    bumpinessReward: 10,
    // Terrain traversability (funnel-based)
    // Penalty for >=4 height cliffs in valid funnel pattern (scaled by distance from edge)
    funnelPenaltyBase: -30,
    // Prohibitive penalty for cliffs that split the field (break funnel pattern)
    splitPenalty: -1000,
    // Avoiding player
    dangerZoneReward: -500,
    dangerZoneDecay: 1.0, // Never decays - always avoids player
  },
};

/**
 * Loads configuration from multiple sources and merges them into DEFAULT_CONSTANTS.
 * Priority: URL Parameters > config.json > Hostname Detection > Defaults
 */
export async function loadConfig() {
  // 1. Hostname-based default
  let debugAI = false;
  if (typeof window !== "undefined") {
    debugAI = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  }

  // 2. config.json (can be injected by build/deploy scripts)
  try {
    // Only attempt fetch if it's available (browser or Node 18+)
    if (typeof fetch !== "undefined") {
      const response = await fetch("./config.json");
      if (response.ok) {
        const fileConfig = await response.json();

        // Merge all file-based overrides into DEFAULT_CONSTANTS
        Object.assign(DEFAULT_CONSTANTS, fileConfig);

        // If DEBUG_AI was explicitly set in config.json, it takes precedence over hostname
        if (fileConfig.DEBUG_AI !== undefined) {
          debugAI = fileConfig.DEBUG_AI;
        }
      }
    }
  } catch (e) {
    // Silent fail if config.json is missing or invalid
  }

  // 3. URL parameter override (highest priority for manual debugging)
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("debug_ai")) {
      debugAI = urlParams.get("debug_ai") === "true";
    }
  }

  // Final assignment to the exported constant object
  DEFAULT_CONSTANTS.DEBUG_AI = debugAI;
}
