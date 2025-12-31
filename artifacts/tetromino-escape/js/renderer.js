import { TETROMINOES } from './config.js';
import { getShape, isChristmasTheme } from './utils.js';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  draw(game) {
    const { ctx, canvas } = this;

    // Clear canvas
    ctx.fillStyle = game.constants.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (["playing", "paused", "gameover", "win"].includes(game.status)) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.clip();

      this.drawEscapeZone(game);
      this.drawDangerIndicators(game);
      this.drawGrid(game);
      this.drawCurrentPiece(game);
      this.drawDebugOverlay(game);
      this.drawPlayer(game);
      this.drawParticles(game);

      ctx.restore();
    }
  }

  drawGrid(game) {
    const { ctx, canvas } = this;
    ctx.strokeStyle = game.constants.GRID_LINE_COLOR;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= game.constants.COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * game.constants.CELL_SIZE, 0);
      ctx.lineTo(x * game.constants.CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y <= game.constants.ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * game.constants.CELL_SIZE);
      ctx.lineTo(canvas.width, y * game.constants.CELL_SIZE);
      ctx.stroke();
    }

    // Blocks
    for (let y = 0; y < game.constants.ROWS; y++) {
      for (let x = 0; x < game.constants.COLS; x++) {
        if (game.grid[y][x]) {
          this.drawBlock(
            x * game.constants.CELL_SIZE,
            y * game.constants.CELL_SIZE,
            game.grid[y][x],
            game.constants.CELL_SIZE,
            game
          );
        }
      }
    }
  }

  drawBlock(x, y, color, size, game, drawCross = false) {
    const { ctx } = this;
    const s = size;

    // Always draw normal block rendering
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, s - 4, s - 4);

    ctx.fillStyle = game.constants.BLOCK_HIGHLIGHT_COLOR;
    ctx.fillRect(x + 2, y + 2, s - 4, 6);
    ctx.fillRect(x + 2, y + 2, 6, s - 4);

    ctx.fillStyle = game.constants.BLOCK_SHADOW_COLOR;
    ctx.fillRect(x + s - 8, y + 8, 6, s - 10);
    ctx.fillRect(x + 8, y + s - 8, s - 10, 6);

    // Draw sabotage indicator if sabotaged
    if (drawCross) {
      const centerX = x + s / 2;
      const centerY = y + s / 2;
      const radius = s * 0.3; // 60% diameter = 30% radius

      // Draw black circle background
      ctx.fillStyle = game.constants.SABOTAGE_INDICATOR_BG;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw red cross inside the circle
      ctx.strokeStyle = game.constants.SABOTAGE_COLOR;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";

      const crossSize = radius * 0.65;
      ctx.beginPath();
      ctx.moveTo(centerX - crossSize, centerY - crossSize);
      ctx.lineTo(centerX + crossSize, centerY + crossSize);
      ctx.moveTo(centerX + crossSize, centerY - crossSize);
      ctx.lineTo(centerX - crossSize, centerY + crossSize);
      ctx.stroke();
    }
  }

  drawCurrentPiece(game) {
    if (!game.currentPiece) return;
    const p = game.currentPiece;
    const isSabotaged = p.diffConfig && p.diffConfig.id === "sabotage";
    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x]) {
          this.drawBlock(
            (p.x + x) * game.constants.CELL_SIZE,
            (p.y + y) * game.constants.CELL_SIZE,
            p.color,
            game.constants.CELL_SIZE,
            game,
            isSabotaged
          );
        }
      }
    }
  }

  drawPlayer(game) {
    const { ctx } = this;
    const p = game.player;
    if (!p) return;

    if (p.dead) {
      ctx.font = `${game.constants.CELL_SIZE}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("😵", p.x + game.constants.PLAYER_WIDTH / 2, p.y + game.constants.PLAYER_HEIGHT / 2);
      return;
    }

    const w = game.constants.PLAYER_WIDTH;
    const h = game.constants.PLAYER_HEIGHT;

    // Body
    ctx.fillStyle = game.constants.PLAYER_BODY_COLOR;
    ctx.fillRect(p.x + w * 0.15, p.y + h * 0.28, w * 0.7, h * 0.45);

    // Head
    ctx.fillStyle = game.constants.PLAYER_HEAD_COLOR;
    ctx.beginPath();
    ctx.arc(p.x + w / 2, p.y + h * 0.18, w * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = game.constants.PLAYER_EYES_COLOR;
    const eyeOff = p.facingRight ? 3 : -3;
    ctx.beginPath();
    ctx.arc(p.x + w / 2 + eyeOff - 5, p.y + h * 0.16, 3, 0, Math.PI * 2);
    ctx.arc(p.x + w / 2 + eyeOff + 5, p.y + h * 0.16, 3, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = game.constants.PLAYER_LEGS_COLOR;
    const legOff = Math.sin(Date.now() / 100) * 3 * (Math.abs(p.vx) > 0.1 ? 1 : 0);
    ctx.fillRect(p.x + w * 0.2, p.y + h * 0.7 + legOff, w * 0.25, h * 0.3);
    ctx.fillRect(p.x + w * 0.55, p.y + h * 0.7 - legOff, w * 0.25, h * 0.3);

    // Arms
    ctx.fillStyle = game.constants.PLAYER_HEAD_COLOR;
    const armWave = p.onGround ? 0 : Math.sin(Date.now() / 80) * 15;
    ctx.save();
    ctx.translate(p.x + w * 0.1, p.y + h * 0.32);
    ctx.rotate(((-20 + armWave) * Math.PI) / 180);
    ctx.fillRect(-3, 0, 6, h * 0.28);
    ctx.restore();

    ctx.save();
    ctx.translate(p.x + w * 0.9, p.y + h * 0.32);
    ctx.rotate(((20 - armWave) * Math.PI) / 180);
    ctx.fillRect(-3, 0, 6, h * 0.28);
    ctx.restore();

    // Draw Santa hat (Christmas theme)
    if (isChristmasTheme()) {
      this.drawSantaHat(p.x + w / 2, p.y + h * 0.18, w * 0.38, game);
    }

    ctx.globalAlpha = 1;
  }

  drawSantaHat(centerX, centerY, headRadius, game) {
    const { ctx } = this;
    ctx.save();

    // Hat base (white trim)
    ctx.fillStyle = game.constants.CHRISTMAS_HAT_WHITE;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - headRadius * 0.6, headRadius * 1.1, headRadius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat body (red triangle)
    ctx.fillStyle = game.constants.CHRISTMAS_HAT_RED;
    ctx.beginPath();
    ctx.moveTo(centerX - headRadius * 0.8, centerY - headRadius * 0.6);
    ctx.lineTo(centerX + headRadius * 0.8, centerY - headRadius * 0.6);
    ctx.lineTo(centerX + headRadius * 0.3, centerY - headRadius * 1.8);
    ctx.closePath();
    ctx.fill();

    // Hat tip (white pom-pom)
    ctx.fillStyle = game.constants.CHRISTMAS_HAT_WHITE;
    ctx.beginPath();
    ctx.arc(centerX + headRadius * 0.3, centerY - headRadius * 1.8, headRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawParticles(game) {
    const { ctx } = this;
    game.particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
    });
    ctx.globalAlpha = 1;
  }

  drawEscapeZone(game) {
    const { ctx, canvas } = this;
    // Semi-transparent green background
    ctx.fillStyle = game.constants.ESCAPE_ZONE_BG;
    ctx.fillRect(0, 0, canvas.width, game.constants.CELL_SIZE * 2);

    // Green dashed line at bottom of zone
    ctx.strokeStyle = game.constants.ESCAPE_ZONE_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, game.constants.CELL_SIZE * 2);
    ctx.lineTo(canvas.width, game.constants.CELL_SIZE * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // "ESCAPE ZONE" text with better positioning
    ctx.fillStyle = game.constants.ESCAPE_ZONE_COLOR;
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("▲ ESCAPE ZONE ▲", canvas.width / 2, game.constants.CELL_SIZE - 2);
    ctx.textBaseline = "alphabetic"; // Reset to default
  }

  drawDangerIndicators(game) {
    const { ctx } = this;
    // Only show danger indicators if playerCompletesLine is enabled for current difficulty
    if (game.settings.diffConfig.playerCompletesLine && game.timers.playerLineClear > 0) {
      const cells = game.getPlayerCompletingCells();
      const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5; // 0 to 1

      ctx.save();
      ctx.shadowBlur = 10 + pulse * 10;
      ctx.shadowColor = game.constants.DANGER_INDICATOR_COLOR;
      const alpha = game.constants.DANGER_INDICATOR_ALPHA_BASE + pulse * game.constants.DANGER_INDICATOR_ALPHA_PULSE;
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;

      cells.forEach((c) => {
        ctx.fillRect(
          c.x * game.constants.CELL_SIZE,
          c.y * game.constants.CELL_SIZE,
          game.constants.CELL_SIZE,
          game.constants.CELL_SIZE
        );
      });
      ctx.restore();
    }
  }

  drawDebugOverlay(game) {
    if (!game.constants.DEBUG_AI) return;
    if (!game.ai || !game.ai.target || !game.currentPiece) return;

    const { ctx } = this;
    const target = game.ai.target;
    const shape = getShape(game.currentPiece.type, target.rotation);
    const cellSize = game.constants.CELL_SIZE;

    // Draw path steps (if any) as small dots
    if (game.ai.path && game.ai.path.length > 0) {
      ctx.save();
      ctx.fillStyle = game.constants.DEBUG_PATH_COLOR;
      for (const step of game.ai.path) {
        const stepShape = getShape(game.currentPiece.type, step.rotation);
        for (let y = 0; y < stepShape.length; y++) {
          for (let x = 0; x < stepShape[y].length; x++) {
            if (stepShape[y][x]) {
              const px = (step.x + x) * cellSize + cellSize / 2;
              const py = (step.y + y) * cellSize + cellSize / 2;
              ctx.beginPath();
              ctx.arc(px, py, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
      ctx.restore();
    }

    // Highlight target position with semi-transparent overlay
    ctx.save();
    ctx.fillStyle = game.constants.DEBUG_TARGET_FILL;
    ctx.strokeStyle = game.constants.DEBUG_TARGET_STROKE;
    ctx.lineWidth = 2;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const px = (target.x + x) * cellSize;
          const py = (target.y + y) * cellSize;
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    ctx.restore();

    // Draw score and debug info in top-left corner (inside canvas)
    ctx.save();
    ctx.fillStyle = game.constants.DEBUG_BG_COLOR;
    ctx.fillRect(5, 35, 120, 72);

    ctx.fillStyle = game.constants.DEBUG_TEXT_COLOR;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const x = 10;
    let y = 40;
    const lineHeight = 14;

    ctx.fillText(`Score: ${game.ai.targetScore?.toFixed(0) ?? "N/A"}`, x, y);
    y += lineHeight;
    ctx.fillText(`Target: (${target.x}, ${target.y})`, x, y);
    y += lineHeight;
    ctx.fillText(`Rot: ${target.rotation}`, x, y);
    y += lineHeight;
    ctx.fillText(`Retargets: ${game.ai.retargetCount}`, x, y);
    y += lineHeight;
    ctx.fillText(`Path: ${game.ai.path?.length ?? 0} steps`, x, y);

    ctx.restore();
  }
}
