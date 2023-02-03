export function percentBetween(min, max, percent) {
  return (max - min) * percent + min;
}

export function distanceTo(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

export function easeInOutQuad(x) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

export function absAngle(x1, y1, x2, y2) {
  return Math.abs(Math.atan2(y2 - y1, x2 - x1));
}
