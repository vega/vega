import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';
import {Delaunay} from 'd3-delaunay';

export default function Voronoi(params) {
  Transform.call(this, null, params);
}

Voronoi.Definition = {
  "type": "Voronoi",
  "metadata": {"modifies": true},
  "params": [
    { "name": "x", "type": "field", "required": true },
    { "name": "y", "type": "field", "required": true },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "default": [[-1e5, -1e5], [1e5, 1e5]],
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

const prototype = inherits(Voronoi, Transform);

const defaultExtent = [-1e5, -1e5, 1e5, 1e5];

prototype.transform = function(_, pulse) {
  const as = _.as || 'path',
      data = pulse.source;
  let delaunay, extent, voronoi, polygon, i, n;

  // configure and construct voronoi diagram
  delaunay = Delaunay.from(data, _.x, _.y);
  extent = _.size ? [0, 0 , ..._.size] : _.extent ? [..._.extent[0], ..._.extent[1]] : defaultExtent;
  this.value = (voronoi = delaunay.voronoi(extent))

  // map polygons to paths
  for (i=0, n=data.length; i<n; ++i) {
    polygon = voronoi.cellPolygon(i);
    data[i][as] = polygon ? toPathString(polygon) : null;
  }

  return pulse.reflow(_.modified()).modifies(as);
};

// suppress duplicated end point vertices
function toPathString(p) {
  const x = p[0][0],
        y = p[0][1];

  let n = p.length - 1;
  for (; p[n][0] === x && p[n][1] === y; --n);

  return 'M' + p.slice(0, n + 1).join('L') + 'Z';
}
