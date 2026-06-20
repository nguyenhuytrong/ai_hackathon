/**
 * Calculate angle at point B, formed by A-B-C
 */
export function calcAngle(A, B, C) {
  const ab = { x: A.x - B.x, y: A.y - B.y };
  const cb = { x: C.x - B.x, y: C.y - B.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.round(Math.acos(cos) * (180 / Math.PI));
}

/**
 * Standard deviation of an array of numbers
 */
export function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Check if a landmark is visible enough
 */
export function isVisible(lm) {
  return lm && (lm.visibility ?? 1) > 0.5;
}

/**
 * Get midpoint between two landmarks
 */
export function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}