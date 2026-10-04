export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Standard relative coordinates from container center (x=0, y=0)
 */
export const DEPARTMENT_OFFSETS: Record<string, NodePosition> = {
  logistics:   { x:   0, y: -280 },
  inventory:   { x: 140, y: -250 },
  orders:      { x:-140, y: -250 },
  finance:     { x: 340, y:  -60 },
  sales:       { x: 360, y:  100 },
  support:     { x:  80, y:  300 },
  product:     { x: -80, y:  300 },
  marketing:   { x:-220, y:  240 },
  engineering: { x:-340, y:  -60 },
  security:    { x:-360, y:  100 },
};

/**
 * Computes absolute pixel positions inside a bounding box
 */
export function calculateNodePosition(
  deptKey: string,
  center: { x: number; y: number },
  scale = 1.0
): NodePosition {
  const offset = DEPARTMENT_OFFSETS[deptKey] || { x: 0, y: 0 };
  return {
    x: center.x + offset.x * scale,
    y: center.y + offset.y * scale,
  };
}

/**
 * Generates an organic quadratic bezier curve SVG path from start to end
 */
export function generateCurvedPath(
  start: NodePosition,
  end: NodePosition,
  curvatureFactor = 0.2
): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Normal vector perpendicular to the chord
  const perpX = -dy * curvatureFactor;
  const perpY = dx * curvatureFactor;

  const controlX = midX + perpX;
  const controlY = midY + perpY;

  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}
