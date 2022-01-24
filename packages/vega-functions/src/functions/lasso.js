import { getScale } from '../scales';
import { field } from 'vega-util';
import intersect from './intersect';


const SELECTION_ID = '_vgsid_';


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
    if (last === undefined || Math.sqrt(Math.pow((last[0] - x), 2) + Math.pow((last[1] - y), 2)) > minDist) {
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
          : i === lasso.length -1
          ? ' Z'
          : `L ${x},${y} `;
    }

    return svg;
}



/**
 * Inverts the lasso from pixel space to an array of vega ids
 * 
 * @param {*} data the dataset
 * @param {*} pixelLasso the lasso in pixel space, [[x,y], [x,y], ...]
 * @param {*} xScaleName the name of the x scale
 * @param {*} xFieldName the name of the x field
 * @param {*} yScaleName the name of the y scale
 * @param {*} yFieldName the name of the y field
 * @returns an array of vega ids
 */
export function invertLasso(markname, pixelLasso, xScaleName, xFieldName, yScaleName, yFieldName) {
    const ids = [];

    const xScale = getScale(xScaleName, this.context);
    const yScale = getScale(yScaleName, this.context);

    const dataLasso = [];

    const bounds = {
        left: Number.MAX_SAFE_INTEGER,
        right: Number.MIN_SAFE_INTEGER,
        top: Number.MAX_SAFE_INTEGER,
        bottom: Number.MIN_SAFE_INTEGER
    };

    // Get bounding box around lasso
    for (const [px, py] of pixelLasso) {
        const dataPoint = [xScale.invert(px), yScale.invert(py)];
        dataLasso.push(dataPoint);

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
        const datum = tuple.datum;

        // TODO: check if x,y is in the datum
        const x = field(xFieldName)(datum);
        const y = field(yFieldName)(datum);

        if (pointInPolygon([x, y], dataLasso)) {
            ids.push(datum[SELECTION_ID]);
        }
    }

    return ids;
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