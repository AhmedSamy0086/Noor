
export interface Point {
  x: number;
  y: number;
  z?: number;
}

/**
 * Calculates angle between three points where B is the vertex
 */
export const calculateAngle = (A: Point, B: Point, C: Point): number => {
  const BA = { x: A.x - B.x, y: A.y - B.y };
  const BC = { x: C.x - B.x, y: C.y - B.y };

  const dotProduct = BA.x * BC.x + BA.y * BC.y;
  const magBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
  const magBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);

  if (magBA === 0 || magBC === 0) return 0;

  const cosTheta = dotProduct / (magBA * magBC);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  return (angle * 180) / Math.PI;
};

/**
 * Checks verticality (e.g., for back straightness)
 */
export const calculateVerticalAngle = (top: Point, bottom: Point): number => {
  const dx = Math.abs(top.x - bottom.x);
  const dy = Math.abs(top.y - bottom.y);
  if (dy === 0) return 90;
  return (Math.atan(dx / dy) * 180) / Math.PI;
};
