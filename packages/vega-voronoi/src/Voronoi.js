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

var prototype = inherits(Voronoi, Transform);

var defaultExtent = [-1e5, -1e5, 1e5, 1e5];

prototype.transform = function(_, pulse) {
  var as = _.as || 'path',
      data = pulse.source,
      delaunay, extent, voronoi, polygon, i, n;

  // configure and construct voronoi diagram
  delaunay = Delaunay.from(data, _.x, _.y);
  extent = _.size ? [0, 0 , ..._.size] : _.extent ? [..._.extent[0], _.extent[1][0]] : defaultExtent;
  this.value = (voronoi = delaunay.voronoi(extent))

  // map polygons to paths
  for (i=0, n=data.length; i<n; ++i) {
    polygon = voronoi.cellPolygon(i);
    data[i][as] = polygon
      ? 'M' + polygon.join('L') + 'Z'
      : null;
  }

  return pulse.reflow(_.modified()).modifies(as);
};
