import intersect from './intersect.js';
import {Bounds} from 'vega-scenegraph';
import {array} from 'vega-util';

/**
 * Appends a new point to the lasso
 *
 * @param {*} lasso the lasso in pixel space
 * @param {*} x the x coordinate in pixel space
 * @param {*} y the y coordinate in pixel space
 * @param {*} minDist the minimum distance, in pixels, that thenew point needs to be apart from the last point
 * @returns a new array containing the lasso with the new point
 */
export function lassoAppend(lasso, x, y, minDist = 5) {
  lasso = array(lasso);
  const last = lasso[lasso.length - 1];

  // Add point to lasso if its the first point or distance to last point exceed minDist
  return (last === undefined || Math.hypot(last[0] - x, last[1] - y) > minDist)
  ? [...lasso, [x, y]]
  : lasso;
}


/**
 * Generates a svg path command which draws a lasso
 *
 * @param {*} lasso the lasso in pixel space in the form [[x,y], [x,y], ...]
 * @returns the svg path command that draws the lasso
 */
export function lassoPath(lasso) {
  return array(lasso).reduce((svg, [x, y], i) => {
  return svg += i == 0
    ? `M ${x},${y} `
    : i === lasso.length - 1
    ? ' Z'
    : `L ${x},${y} `;
  }, '');
}



/**
 * Inverts the lasso from pixel space to an array of vega scenegraph tuples
 *
 * @param {*} data the dataset
 * @param {*} pixelLasso the lasso in pixel space, [[x,y], [x,y], ...]
 * @param {*} unit the unit where the lasso is defined
 *
 * @returns an array of vega scenegraph tuples
 */
export function intersectLasso(markname, pixelLasso, unit) {
  const { x, y, mark } = unit;

  const bb = new Bounds().set(
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER
  );

  // Get bounding box around lasso
  for (const [px, py] of pixelLasso) {
    if (px < bb.x1) bb.x1 = px;
    if (px > bb.x2) bb.x2 = px;
    if (py < bb.y1) bb.y1 = py;
    if (py > bb.y2) bb.y2 = py;
  }

  // Translate bb against unit coordinates
  bb.translate(x, y);

  const intersection = intersect([[bb.x1, bb.y1], [bb.x2, bb.y2]],
    markname,
    mark);

  // Check every point against the lasso
  return intersection.filter(tuple => pointInPolygon(tuple.x, tuple.y, pixelLasso));
}



/**
 * Performs a test if a point is inside a polygon based on the idea from
 * https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
 *
 * This method will not need the same start/end point since it wraps around the edges of the array
 *
 * @param {*} test a point to test against
 * @param {*} polygon a polygon in the form [[x,y], [x,y], ...]
 * @returns true if the point lies inside the polygon, false otherwise
 */
function pointInPolygon(testx, testy, polygon) {
  let intersections = 0;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [prevX, prevY] = polygon[j];
    const [x, y] = polygon[i];

    // count intersections
    if (((y > testy) != (prevY > testy)) && (testx < (prevX - x) * (testy - y) / (prevY - y) + x)) {
      intersections++;
    }
  }

  // point is in polygon if intersection count is odd
  return intersections & 1;
}
