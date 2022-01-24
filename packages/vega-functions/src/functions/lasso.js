import intersect from './intersect';


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
  const last = lasso[lasso.length - 1];

  // Add point to lasso if distance to last point exceed minDist or its the first point
  if (last === undefined || Math.sqrt(((last[0] - x) ** 2) + ((last[1] - y) ** 2)) > minDist) {
    lasso.push([x, y]);

    return [...lasso];
  }

  return lasso;
}


/**
 * Generates a svg path command which draws a lasso
 * 
 * @param {*} lasso the lasso in pixel space in the form [[x,y], [x,y], ...]
 * @returns the svg path command that draws the lasso
 */
export function lassoPath(lasso) {
  let svg = '';
  for (const [i, [x, y]] of lasso.entries()) {
    svg += i === 0
      ? `M ${x},${y} `
      : i === lasso.length - 1
        ? ' Z'
        : `L ${x},${y} `;
  }

  return svg;
}



/**
 * Inverts the lasso from pixel space to an array of vega scenegraph tuples
 * 
 * @param {*} data the dataset
 * @param {*} pixelLasso the lasso in pixel space, [[x,y], [x,y], ...]
 * 
 * @returns an array of vega scenegraph tuples
 */
export function intersectLasso(markname, pixelLasso) {
  const tuples = [];

  const bounds = {
    left: Number.MAX_SAFE_INTEGER,
    right: Number.MIN_SAFE_INTEGER,
    top: Number.MAX_SAFE_INTEGER,
    bottom: Number.MIN_SAFE_INTEGER
  };

  // Get bounding box around lasso
  for (const [px, py] of pixelLasso) {
    if (px < bounds.left) bounds.left = px;
    if (px > bounds.right) bounds.right = px;
    if (py < bounds.top) bounds.top = py;
    if (py > bounds.bottom) bounds.bottom = py;
  }

  const intersection = intersect([[bounds.left, bounds.top], [bounds.right, bounds.bottom]],
    { markname },
    this.context.dataflow.scenegraph().root);

  // Check every point against the lasso
  for (const tuple of intersection) {
    if (pointInPolygon([tuple.x, tuple.y], pixelLasso)) {
      tuples.push(tuple);
    }
  }

  return tuples;
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
function pointInPolygon(test, polygon) {
  const [testx, testy] = test;
  var intersections = 0;

  for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
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