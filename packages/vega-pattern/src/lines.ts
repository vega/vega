import type {PatternRuleSpec} from './types.js';

/** Options accepted by {@link buildLinesPath}; a PatternLinesShape minus its `type` discriminator. */
export type LinesOptions = PatternRuleSpec;

/**
 * Expand a rule/lines pattern definition into an SVG path made of line
 * segments, clipped against a square pattern tile. Used to render
 * angled stripe/hatch style patterns from a compact { angle, spacing,
 * bleed, phase } authoring spec rather than a hand-written path string.
 *
 * @param opts
 * @param opts.angle - line angle(s) in degrees (default 45).
 *   An array of angles unions multiple line sets (e.g., for crosshatch).
 * @param opts.spacing - spacing between parallel lines (default tileSize / 2).
 * @param opts.bleed - distance lines extend past the tile
 *   edge, to avoid seams when the pattern is tiled (default 1).
 * @param opts.phase - offset applied along the line normal (default 0).
 * @param tileSize - the pattern tile size; the tile spans
 *   [0, tileSize] x [0, tileSize].
 * @return an SVG path string, in tile-space coordinates.
 */
export function buildLinesPath(opts: LinesOptions = {}, tileSize: number): string {
  const angle = opts.angle ?? 45;
  const spacing = opts.spacing != null ? opts.spacing : tileSize / 2;
  const bleed = opts.bleed != null ? opts.bleed : 1;
  const phase = opts.phase != null ? opts.phase : 0;
  const angles = Array.isArray(angle) ? angle : [angle];

  const xmin = -bleed, ymin = -bleed;
  const xmax = tileSize + bleed, ymax = tileSize + bleed;
  const corners: [number, number][] = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];
  const parts: string[] = [];

  const pushSeg = (x1: number, y1: number, x2: number, y2: number) => {
    parts.push('M' + fmt(x1) + ',' + fmt(y1) + ' L' + fmt(x2) + ',' + fmt(y2));
  };

  const genForAngle = (deg: number) => {
    const th = (deg || 0) * Math.PI / 180;
    // direction v = (cos th, sin th), unit normal n = (-sin th, cos th)
    const nx = -Math.sin(th), ny = Math.cos(th);
    const norm = Math.hypot(nx, ny) || 1;
    const ux = nx / norm, uy = ny / norm;

    // project corners onto the normal to get the range of offsets to cover
    let dmin = Infinity, dmax = -Infinity;
    for (const [cx, cy] of corners) {
      const d = ux * cx + uy * cy;
      if (d < dmin) dmin = d;
      if (d > dmax) dmax = d;
    }
    if (!(spacing > 0)) return;

    const kmin = Math.ceil((dmin - phase) / spacing);
    const kmax = Math.floor((dmax - phase) / spacing);
    for (let k = kmin; k <= kmax; ++k) {
      const d = phase + k * spacing;

      // intersect the line at offset d with the (bled) tile rectangle
      const pts: [number, number][] = [];
      if (Math.abs(ux) > 1e-6) {
        let x = (d - uy * ymin) / ux;
        if (x >= xmin - 1e-6 && x <= xmax + 1e-6) pts.push([x, ymin]);
        x = (d - uy * ymax) / ux;
        if (x >= xmin - 1e-6 && x <= xmax + 1e-6) pts.push([x, ymax]);
      }
      if (Math.abs(uy) > 1e-6) {
        let y = (d - ux * xmin) / uy;
        if (y >= ymin - 1e-6 && y <= ymax + 1e-6) pts.push([xmin, y]);
        y = (d - ux * xmax) / uy;
        if (y >= ymin - 1e-6 && y <= ymax + 1e-6) pts.push([xmax, y]);
      }

      // dedupe near-coincident points
      const uniq: [number, number][] = [];
      for (const p of pts) {
        let found = false;
        for (const q of uniq) {
          if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6) { found = true; break; }
        }
        if (!found) uniq.push(p);
      }

      if (uniq.length >= 2) {
        // pick the two furthest-apart points to avoid noisy duplicates
        let bestI = 0, bestJ = 1, bestD = -1;
        for (let i = 0; i < uniq.length; ++i) {
          for (let j = i + 1; j < uniq.length; ++j) {
            const dd = (uniq[i][0] - uniq[j][0]) ** 2 + (uniq[i][1] - uniq[j][1]) ** 2;
            if (dd > bestD) { bestD = dd; bestI = i; bestJ = j; }
          }
        }
        pushSeg(uniq[bestI][0], uniq[bestI][1], uniq[bestJ][0], uniq[bestJ][1]);
      }
    }
  };

  for (const ang of angles) genForAngle(ang);
  return parts.join(' ');
}

function fmt(x: number): string {
  const v = Math.abs(x) < 1e-6 ? 0 : x;
  // prefer integers when close
  if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
  return Number(v.toFixed(3)).toString();
}
