import { TETROMINOES } from './config.js';

/**
 * Helper Functions
 */

export function getShape(type, rotation) {
  const shapes = TETROMINOES[type].shapes;
  return shapes[rotation % shapes.length];
}

export function getRandomTetrominoType() {
  const types = Object.keys(TETROMINOES);
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Check if the current date is within the Christmas theme period (Dec 20 - Jan 10)
 */
export function isChristmasTheme() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0 = Jan, 11 = Dec
  const day = now.getDate();

  // December 20-31
  if (month === 11 && day >= 20) {
    return true;
  }

  // January 1-10
  if (month === 0 && day <= 10) {
    return true;
  }

  return false;
}
