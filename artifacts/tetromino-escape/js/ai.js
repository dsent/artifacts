import { TETROMINOES } from './config.js';
import { getShape } from './utils.js';

export class AIController {
  constructor(engine) {
    this.engine = engine;
    this.reset();
  }

  reset() {
    this.moveCount = 0;
    this.retargetCount = 0;
    this.target = null;
    this.targetScore = null;
    this.path = [];
    this.state = "targeting";
    this.erraticDir = 1;
    // Track for meaningful retarget detection
    this.lastTargetKey = null;
    this.lastPlayerGridX = null;
    this.pathThroughDanger = false;
    this.playerInDangerTicks = 0;
  }

  /**
   * Calculate funnel validity bounds for terrain traversability
   * 
   * FUNNEL PATTERN CONCEPT:
   * A "funnel" is a terrain shape that slopes from the edges toward the center.
   * This allows the player to climb from low areas to high areas.
   * 
   * Example valid funnel from left:
   *   Heights: [2, 3, 4, 5, 4, 3, 2, 1, 1, 1]
   *            ^^^^^^^^^^^^ (ascending from left edge)
   * 
   * Example valid funnel from right:
   *   Heights: [5, 5, 4, 3, 4, 5, 6, 7, 8, 9]
   *                     ^^^^^^^^^^^^^^^^^^^^^ (ascending from right edge)
   * 
   * The bounds tell us how far each funnel extends from its edge.
   * 
   * @param {Array<number>} heights - Column heights
   * @returns {{leftValidUntil: number, rightValidUntil: number}}
   */
  calculateFunnelBounds(heights) {
    const COLS = this.engine.constants.COLS;
    
    // Left funnel: heights increase or stay same from left edge
    let leftFunnelValidUntil = 0;
    for (let x = 1; x < COLS; x++) {
      if (heights[x] <= heights[x - 1]) {
        leftFunnelValidUntil = x;
      } else {
        break;
      }
    }

    // Right funnel: heights increase or stay same from right edge
    let rightFunnelValidUntil = COLS - 1;
    for (let x = COLS - 2; x >= 0; x--) {
      if (heights[x] <= heights[x + 1]) {
        rightFunnelValidUntil = x;
      } else {
        break;
      }
    }

    return { leftFunnelValidUntil, rightFunnelValidUntil };
  }

  /**
   * Evaluate terrain penalty based on cliff heights and funnel patterns
   * @param {Array<number>} heights - Column heights
   * @param {Object} diffConfig - Difficulty configuration
   * @param {Object} funnelBounds - Funnel validity bounds
   * @param {boolean} detailed - Whether to return detailed cliff info
   * @returns {number|Object} Terrain penalty score or detailed breakdown
   */
  evaluateTerrainPenalty(heights, diffConfig, funnelBounds, detailed = false) {
    const COLS = this.engine.constants.COLS;
    const MID = Math.floor(COLS / 2);
    const CLIFF_HEIGHT = this.engine.constants.CLIFF_HEIGHT_THRESHOLD;
    
    let terrainPenalty = 0;
    const cliffs = detailed ? [] : null;

    for (let x = 0; x < COLS - 1; x++) {
      const heightDiff = Math.abs(heights[x] - heights[x + 1]);
      if (heightDiff < CLIFF_HEIGHT) continue;

      const higherCol = heights[x] > heights[x + 1] ? x : x + 1;
      const lowerCol = heights[x] > heights[x + 1] ? x + 1 : x;
      let isValidFunnel = false;

      if (higherCol <= MID) {
        if (higherCol < lowerCol && funnelBounds.leftFunnelValidUntil >= lowerCol) {
          isValidFunnel = true;
        }
      } else {
        if (higherCol > lowerCol && funnelBounds.rightFunnelValidUntil <= lowerCol) {
          isValidFunnel = true;
        }
      }

      const distFromEdge = Math.min(higherCol, COLS - 1 - higherCol);
      let penalty;
      if (isValidFunnel) {
        penalty = diffConfig.funnelPenaltyBase * Math.pow(2, distFromEdge);
      } else {
        penalty = diffConfig.splitPenalty;
      }
      terrainPenalty += penalty;

      if (cliffs) {
        cliffs.push({ x, heightDiff, higherCol, isValidFunnel, distFromEdge, penalty });
      }
    }

    if (detailed) {
      return { penalty: terrainPenalty, cliffs };
    }
    return terrainPenalty;
  }

  /**
   * Check if rotation is possible without collision with locked blocks
   * @param {number} currentX - Current X position
   * @param {number} currentY - Current Y position  
   * @param {Array} currentShape - Current piece shape
   * @param {Array} nextShape - Next rotation shape
   * @returns {boolean} True if rotation is possible
   */
  checkRotationOcclusion(currentX, currentY, currentShape, nextShape) {
    const width = Math.max(currentShape[0].length, nextShape[0].length);
    const height = Math.max(currentShape.length, nextShape.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gridY = currentY + y;
        const gridX = currentX + x;

        if (gridY >= 0 && gridY < this.engine.constants.ROWS && gridX >= 0 && gridX < this.engine.constants.COLS) {
          if (this.engine.grid[gridY][gridX] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Execute erratic movement when sabotaged
   * Randomly moves and rotates the piece
   */
  performErraticMove() {
    const piece = this.engine.currentPiece;
    if (Math.random() < 0.1) this.erraticDir *= -1;

    if (this.engine.canPlacePieceWithPlayer(piece, this.erraticDir, 0)) {
      piece.x += this.erraticDir;
      this.engine.recordAIMove(this.erraticDir > 0 ? 'e' : 'E'); // e=erratic right, E=erratic left
    } else {
      this.erraticDir *= -1;
    }

    if (Math.random() < 0.05) {
      const newRot = (piece.rotation + 1) % TETROMINOES[piece.type].shapes.length;
      const newShape = getShape(piece.type, newRot);
      if (
        this.engine.canPlacePieceWithPlayer(piece, 0, 0, newShape) &&
        this.checkRotationOcclusion(piece.x, piece.y, piece.shape, newShape)
      ) {
        piece.rotation = newRot;
        piece.shape = newShape;
        this.engine.recordAIMove('X'); // X=erratic rotate
      }
    }
  }

  /**
   * Calculate the best landing position for current piece using BFS pathfinding
   * Evaluates all reachable positions and selects the one with highest score
   * @param {Object} overrideConfig - Optional difficulty config override (for sabotage)
   * @param {boolean} avoidPlayer - Whether to apply danger zone penalties
   * @param {boolean} playerTriggered - Whether this calculation was triggered by player movement
   */
  calculateTarget(overrideConfig = null, avoidPlayer = false, playerTriggered = false) {
    if (!this.engine.currentPiece) {
      this.target = null;
      this.path = [];
      return;
    }

    // Reset path danger flag for this calculation
    this.pathThroughDanger = false;

    let bestScore = -Infinity;
    let bestState = null;
    const diffConfig = overrideConfig || this.engine.settings.diffConfig;
    const shapes = TETROMINOES[this.engine.currentPiece.type].shapes;

    // Calculate board urgency (Panic Mode)
    let currentMaxHeight = 0;
    for (let y = 0; y < this.engine.constants.ROWS; y++) {
      if (this.engine.grid[y].some((c) => c !== null)) {
        currentMaxHeight = this.engine.constants.ROWS - y;
        break;
      }
    }

    // Avoidance parameters
    let dangerZone = null;
    let dangerZoneReward = diffConfig.dangerZoneReward; // The reward is usually negative

    if (avoidPlayer && this.engine.player) {
      dangerZone = this.engine.getPlayerDangerZone();

      // Apply decay based on retarget count
      // Easy (1.0): never decays, Normal (0.7): moderate, Hard (0.4): aggressive
      const decay = diffConfig.dangerZoneDecay ?? 1.0;
      dangerZoneReward = diffConfig.dangerZoneReward * Math.pow(decay, this.retargetCount);

      // Linearly reduce targeting player's danger zone reward as board fills up ("Panic Mode")
      // For negative rewards, this makes them less negative; positive rewards become less positive.
      // In any case, this will make AI stop caring about the player and just focus on survival.
      dangerZoneReward = Math.min(0, dangerZoneReward - currentMaxHeight * (dangerZoneReward / 20));
    }

    // BFS State: { x, y, rotation }
    const startState = {
      x: this.engine.currentPiece.x,
      y: this.engine.currentPiece.y,
      rotation: this.engine.currentPiece.rotation,
    };
    const startKey = `${startState.x},${startState.y},${startState.rotation}`;

    const queue = [startState];
    const visited = new Set([startKey]);
    const parents = new Map(); // key -> { parentKey, action }

    let iterations = 0;
    const MAX_ITERATIONS = this.engine.constants.AI_MAX_BFS_ITERATIONS;

    while (queue.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      const current = queue.shift();
      const currentKey = `${current.x},${current.y},${current.rotation}`;
      const shape = shapes[current.rotation];

      // Check if resting spot (cannot move down)
      const tempPiece = {
        x: current.x,
        y: current.y,
        rotation: current.rotation,
        shape: shape,
        type: this.engine.currentPiece.type,
      };

      const canMoveDown = this.engine.canPlacePiece(tempPiece, 0, 1);

      if (!canMoveDown) {
        // Evaluate resting spot
        let dzReward = 0;
        if (avoidPlayer && dangerZone) {
          // Use centralized danger check which accounts for ceiling/riding safety
          if (this.engine.isPlayerInDangerZone(tempPiece)) {
            dzReward = dangerZoneReward;
          }
        }

        const score = this.evaluatePosition(tempPiece, shape, diffConfig) + dzReward;
        if (score > bestScore) {
          bestScore = score;
          bestState = current;
        }
      }

      // Generate neighbors
      // Order is important: Horizontal/Rotation moves are checked before Down.
      // This ensures that BFS finds paths that move horizontally/rotate as early as possible
      // (at the highest possible Y), rather than dropping first and moving later.
      const neighbors = [
        { action: "left", dx: -1, dy: 0, drot: 0 },
        { action: "right", dx: 1, dy: 0, drot: 0 },
        { action: "rotate", dx: 0, dy: 0, drot: 1 },
        { action: "down", dx: 0, dy: 1, drot: 0 },
      ];

      for (const n of neighbors) {
        const nextRot = (current.rotation + n.drot) % shapes.length;
        const nextX = current.x + n.dx;
        const nextY = current.y + n.dy;

        const nextKey = `${nextX},${nextY},${nextRot}`;
        if (visited.has(nextKey)) continue;

        const nextShape = shapes[nextRot];

        if (avoidPlayer) {
          // Check if this step puts the piece in a dangerous position
          const nextPiece = {
            x: nextX,
            y: nextY,
            rotation: nextRot,
            shape: nextShape,
            type: this.engine.currentPiece.type,
          };

          const nextInDanger = this.engine.isPlayerInDangerZone(nextPiece);

          if (nextInDanger) {
            // Check if we're currently in danger
            const currentPiece = {
              x: current.x,
              y: current.y,
              rotation: current.rotation,
              shape: shape,
              type: this.engine.currentPiece.type,
            };

            const currentInDanger = this.engine.isPlayerInDangerZone(currentPiece);

            // NEVER enter danger from safety
            if (!currentInDanger) {
              continue;
            }

            // If already in danger:
            // - Allow ALL moves to find escape routes
            // - Mark that this path goes through danger (affects descent speed)
            // - The escape penalty in scoring will guide the AI toward safe destinations
            this.pathThroughDanger = true;
          }
        }

        let valid = false;
        if (n.action === "rotate") {
          if (
            this.engine.canPlacePiece(
              { x: current.x, y: current.y, shape: shape, type: this.engine.currentPiece.type },
              0,
              0,
              nextShape
            ) &&
            this.checkRotationOcclusion(current.x, current.y, shape, nextShape)
          ) {
            valid = true;
          }
        } else {
          if (
            this.engine.canPlacePiece(
              { x: current.x, y: current.y, shape: shape, type: this.engine.currentPiece.type },
              n.dx,
              n.dy
            )
          ) {
            valid = true;
          }
        }

        if (valid) {
          visited.add(nextKey);
          parents.set(nextKey, { parentKey: currentKey, action: n.action });
          queue.push({ x: nextX, y: nextY, rotation: nextRot });
        }
      }
    }

    this.target = bestState;
    this.targetScore = bestScore;

    // Track target changes for meaningful retarget counting
    const newTargetKey = bestState ? `${bestState.x},${bestState.y},${bestState.rotation}` : null;

    if (newTargetKey) {
      if (playerTriggered && this.lastTargetKey !== null && newTargetKey !== this.lastTargetKey) {
        // Increment every time target changes due to player movement
        this.retargetCount++;
      }
    }
    this.lastTargetKey = newTargetKey;

    // Track player position for change detection
    if (this.engine.player) {
      this.lastPlayerGridX = this.engine.getPlayerGridX();
    }

    this.path = [];
    if (bestState) {
      let currKey = `${bestState.x},${bestState.y},${bestState.rotation}`;
      this.path.unshift({ x: bestState.x, y: bestState.y, rotation: bestState.rotation });

      while (currKey !== startKey) {
        const info = parents.get(currKey);
        if (!info) break;
        const [px, py, prot] = info.parentKey.split(",").map(Number);
        this.path.unshift({ x: px, y: py, rotation: prot });
        currKey = info.parentKey;
      }
      if (this.path.length > 0) {
        this.path.shift();
      }
    }
  }

  /**
   * Evaluate a piece placement position
   *
   * SCORING SYSTEM:
   * The AI uses a weighted scoring system based on Dellacherie-Thiery research:
   *
   * 1. Line Clearing: Rewards completing lines (varies by difficulty)
   * 2. Holes: Base penalty for gaps below blocks
   * 3. Hole Depth: Extra penalty for blocks above holes (burying makes holes harder to clear)
   * 4. Weighted Holes: Upper-row holes penalized more than lower-row holes
   * 5. Rows With Holes: Heavy penalty for spreading holes across multiple rows
   * 6. Column Transitions: Penalizes vertical fragmentation (cheese patterns)
   * 7. Height: Penalizes tall stacks (risk of game over)
   * 8. Bumpiness: Penalizes uneven surfaces (harder to place pieces)
   * 9. Terrain Traversability: Uses "funnel pattern" analysis
   *    - Valid funnels: Cliffs that slope from edges toward center (player can climb)
   *    - Split penalties: Cliffs that block player movement across field
   * 10. Edge Height: Slight bonus for low edges (easier player escape)
   * 11. Floating Penalty: Discourages placing pieces high without support
   *
   * Difficulty modifies the weight of each component to create different AI behaviors.
   *
   * @param {Object} piece - The piece being evaluated
   * @param {Array} shape - The piece shape
   * @param {Object} diffConfig - Difficulty configuration with scoring weights
   * @param {boolean} detailed - Whether to return detailed breakdown
   * @returns {number|Object} Score or detailed breakdown object
   */
  evaluatePosition(piece, shape, diffConfig, detailed = false) {
    // Create hypothetical grid with piece placed
    let tempGrid = this.engine.grid.map((row) => [...row]);

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const gy = piece.y + y;
          const gx = piece.x + x;
          if (gy >= 0 && gy < this.engine.constants.ROWS) tempGrid[gy][gx] = true;
        }
      }
    }

    const diff = diffConfig;
    const COLS = this.engine.constants.COLS;
    const MID = Math.floor(COLS / 2);

    // Line clearing: Count and reward completed lines
    let completedLines = 0;
    for (let y = 0; y < this.engine.constants.ROWS; y++) {
      if (tempGrid[y].every((c) => c)) completedLines++;
    }
    let linesScore = completedLines * diff.lineReward;
    let multiLineBonus = 0;
    if (completedLines > 0 && diff.multiLineBonus) {
      if (completedLines >= 4) multiLineBonus = 150;
      else if (completedLines >= 2) multiLineBonus = 50;
    }

    // Grid after line clears
    let gridAfter = tempGrid.filter((row) => !row.every((c) => c));
    while (gridAfter.length < this.engine.constants.ROWS) gridAfter.unshift(Array(COLS).fill(null));

    // Column heights
    const heights = [];
    for (let x = 0; x < COLS; x++) {
      let h = 0;
      for (let y = 0; y < this.engine.constants.ROWS; y++) {
        if (gridAfter[y][x]) {
          h = this.engine.constants.ROWS - y;
          break;
        }
      }
      heights.push(h);
    }

    // Holes analysis with multiple metrics:
    // - holes: total count of empty cells below blocks
    // - holeDepth: sum of blocks above each hole (penalizes burying holes)
    // - weightedHoles: sum of (ROWS - y) for each hole (upper holes worse)
    // - rowsWithHoles: count of distinct rows containing holes
    let holes = 0;
    let holeDepth = 0;
    let weightedHoles = 0;
    const rowsWithHolesSet = new Set();

    for (let x = 0; x < COLS; x++) {
      let blockFound = false;
      let blocksAbove = 0;
      for (let y = 0; y < this.engine.constants.ROWS; y++) {
        if (gridAfter[y][x]) {
          blockFound = true;
          blocksAbove++;
        } else if (blockFound) {
          holes++;
          holeDepth += blocksAbove;
          weightedHoles += (this.engine.constants.ROWS - y); // Upper holes weighted more
          rowsWithHolesSet.add(y);
        }
      }
    }
    const rowsWithHoles = rowsWithHolesSet.size;

    // Column transitions: count vertical empty-to-filled switches
    // High value indicates fragmented/cheese-like patterns
    let colTransitions = 0;
    for (let x = 0; x < COLS; x++) {
      // Bottom edge counts as filled (transition if bottom cell is empty)
      if (!gridAfter[this.engine.constants.ROWS - 1][x]) {
        colTransitions++;
      }
      // Count transitions between adjacent cells
      for (let y = 0; y < this.engine.constants.ROWS - 1; y++) {
        const current = gridAfter[y][x] ? 1 : 0;
        const below = gridAfter[y + 1][x] ? 1 : 0;
        if (current !== below) {
          colTransitions++;
        }
      }
    }

    // Bumpiness
    let bumpiness = 0;
    for (let x = 0; x < COLS - 1; x++) bumpiness += Math.abs(heights[x] - heights[x + 1]);

    // Terrain traversability analysis
    const funnelBounds = this.calculateFunnelBounds(heights);
    const terrainResult = this.evaluateTerrainPenalty(heights, diff, funnelBounds, detailed);
    const terrainPenalty = detailed ? terrainResult.penalty : terrainResult;
    const cliffs = detailed ? terrainResult.cliffs : null;

    // Calculate individual score components
    const holesScore = holes * diff.holeReward;
    const holeDepthScore = holeDepth * (diff.holeDepthReward ?? 0);
    const weightedHolesScore = weightedHoles * (diff.weightedHoleReward ?? 0);
    const rowsWithHolesScore = rowsWithHoles * (diff.rowsWithHolesReward ?? 0);
    const colTransitionsScore = colTransitions * (diff.colTransitionReward ?? 0);
    const heightScore = heights.reduce((a, b) => a + b, 0) * diff.heightReward;
    const maxBoardHeight = Math.max(...heights);
    const maxHeightScore = maxBoardHeight * diff.maxHeightReward;

    let dangerScore = 0;
    if (maxBoardHeight >= this.engine.constants.ROWS - this.engine.constants.AI_PANIC_HEIGHT) {
      dangerScore = -100000;
    } else if (maxBoardHeight >= this.engine.constants.ROWS - this.engine.constants.AI_WARNING_HEIGHT) {
      dangerScore = -20000;
    }

    const bumpinessScore = bumpiness * diff.bumpinessReward;

    const minEdge = Math.min(heights[0], heights[COLS - 1]);
    const edgeScore = (10 - minEdge) * 3;

    const pieceBottom = piece.y + piece.shape.length;
    const floatingScore = pieceBottom < 4 ? -(4 - pieceBottom) * 30 : 0;

    // Sum all components
    const total =
      linesScore +
      multiLineBonus +
      holesScore +
      holeDepthScore +
      weightedHolesScore +
      rowsWithHolesScore +
      colTransitionsScore +
      heightScore +
      maxHeightScore +
      dangerScore +
      bumpinessScore +
      terrainPenalty +
      edgeScore +
      floatingScore;

    if (!detailed) {
      return total;
    }

    // Return detailed breakdown
    return {
      lines: linesScore,
      multiLineBonus,
      holes: holesScore,
      holeDepth: holeDepthScore,
      weightedHoles: weightedHolesScore,
      rowsWithHoles: rowsWithHolesScore,
      colTransitions: colTransitionsScore,
      height: heightScore,
      maxHeight: maxHeightScore,
      danger: dangerScore,
      bumpiness: bumpinessScore,
      terrain: terrainPenalty,
      edge: edgeScore,
      floating: floatingScore,
      total,
      // Raw values for analysis
      heights,
      rawLines: completedLines,
      rawHoles: holes,
      rawHoleDepth: holeDepth,
      rawWeightedHoles: weightedHoles,
      rawRowsWithHoles: rowsWithHoles,
      rawColTransitions: colTransitions,
      rawBumpiness: bumpiness,
      funnelInfo: {
        leftValid: funnelBounds.leftFunnelValidUntil,
        rightValid: funnelBounds.rightFunnelValidUntil,
        cliffs: cliffs || [],
      },
    };
  }

  /**
   * Update AI state and execute moves toward target
   * Handles erratic movement during sabotage and pathfinding execution
   */
  update() {
    if (!this.engine.currentPiece) return;
    this.moveCount++;

    // Track how long player has been in TARGET's danger zone (not current piece position)
    // This allows retargeting even when piece is far above but heading toward player
    if (this.target) {
      const targetPiece = {
        x: this.target.x,
        y: this.target.y,
        rotation: this.target.rotation,
        shape: getShape(this.engine.currentPiece.type, this.target.rotation),
        type: this.engine.currentPiece.type,
      };
      if (this.engine.isPlayerInDangerZone(targetPiece)) {
        this.playerInDangerTicks++;
      } else {
        this.playerInDangerTicks = 0;
      }
    } else {
      this.playerInDangerTicks = 0;
    }

    if (this.engine.timers.sabotage > 0 && this.state === "erratic") {
      this.performErraticMove();
      if (this.engine.getDropDistance() < this.engine.constants.AI_FAST_DROP_HEIGHT) {
        this.state = "targeting";
      }
      return;
    }

    if (this.path && this.path.length > 0) {
      const piece = this.engine.currentPiece;

      // Clean up path steps we've already passed or reached
      while (this.path.length > 0) {
        const step = this.path[0];
        if (step.y < piece.y) {
          // Passed by gravity
          this.path.shift();
        } else if (step.y === piece.y && step.x === piece.x && step.rotation === piece.rotation) {
          // Reached
          this.path.shift();
        } else {
          break;
        }
      }

      if (this.path.length === 0) {
        return; // Path complete
      }

      const nextStep = this.path[0];

      // If path goes through danger, stop ALL moves (not just down)
      // This forces retargeting while piece only falls via gravity
      if (this.pathThroughDanger) {
        return;
      }

      // If next step is down (y > piece.y)
      if (nextStep.y > piece.y) {
        // Check spawn/landing buffers - use gravity for natural feel
        const dropDistance = this.engine.getDropDistance();
        const diffConfig = this.engine.settings.diffConfig;

        // Too close to spawn - let gravity handle initial descent
        if (piece.fallStepCount < diffConfig.aiSpawnGravityRows) {
          return;
        }

        // Too close to landing - let gravity handle final descent
        if (dropDistance <= diffConfig.aiLandingGravityRows) {
          return;
        }

        // Path is clear and we're in the middle section - AI makes down move for faster descent
        if (this.engine.canPlacePieceWithPlayer(piece, 0, 1)) {
          piece.y++;
          piece.aiControlledDescent = true; // Flag to prevent gravity this tick
          this.engine.recordAIMove("d");
          return;
        }
        // Can't move down - wait for next update
        return;
      }

      // Execute move toward next step
      let success = false;

      // Check if we're currently in collision with player (emergency situation)
      const currentlyInDanger = this.engine.isPlayerInDangerZone(piece);

      if (piece.rotation !== nextStep.rotation) {
        const newRot = nextStep.rotation;
        const newShape = getShape(piece.type, newRot);
        // If already in danger, allow rotation even if it would still be in danger
        // (emergency escape - can't get worse)
        if (currentlyInDanger) {
          if (this.engine.canPlacePiece(piece, 0, 0, newShape)) {
            piece.rotation = newRot;
            piece.shape = newShape;
            success = true;
            this.engine.recordAIMove("R");
          }
        } else if (this.engine.canPlacePieceWithPlayer(piece, 0, 0, newShape)) {
          piece.rotation = newRot;
          piece.shape = newShape;
          success = true;
          this.engine.recordAIMove("R");
        }
      } else if (piece.x !== nextStep.x) {
        const dx = Math.sign(nextStep.x - piece.x);
        // If already in danger, allow horizontal move even if it would still be in danger
        // (emergency escape - can't get worse)
        if (currentlyInDanger) {
          if (this.engine.canPlacePiece(piece, dx, 0)) {
            piece.x += dx;
            success = true;
            this.engine.recordAIMove(dx > 0 ? "r" : "l");
          }
        } else if (this.engine.canPlacePieceWithPlayer(piece, dx, 0)) {
          piece.x += dx;
          success = true;
          this.engine.recordAIMove(dx > 0 ? "r" : "l");
        }
      }

      if (!success) {
        // Move failed - check if we should recalculate or just give up
        const dropDistance = this.engine.getDropDistance();

        if (dropDistance <= 3) {
          // Too close to landing - don't recalculate, just accept current position
          // This prevents erratic last-second movements
          this.path = [];
          this.target = { x: piece.x, y: piece.y + dropDistance, rotation: piece.rotation };
        } else {
          // Still have room - recalculate path
          this.calculateTarget(null, this.engine.isPlayerInDangerZone());
        }
      }
    }
  }
}
