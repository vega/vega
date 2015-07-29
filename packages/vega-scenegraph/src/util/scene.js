var bound = require('../util/bound');

var sets = [
  'items',
  'axisItems',
  'legendItems'
];

var keys = [
  'marktype', 'name', 'interactive', 'clip',
  'items', 'axisItems', 'legendItems', 'layer',
  'x', 'y', 'width', 'height', 'align', 'baseline',             // layout
  'fill', 'fillOpacity', 'opacity',                             // fill
  'stroke', 'strokeOpacity', 'strokeWidth', 'strokeCap',        // stroke
  'strokeDash', 'strokeDashOffset',                             // stroke dash
  'startAngle', 'endAngle', 'innerRadius', 'outerRadius',       // arc
  'interpolate', 'tension', 'orient',                           // area, line
  'url',                                                        // image
  'path',                                                       // path
  'x2', 'y2',                                                   // rule
  'size', 'shape',                                              // symbol
  'text', 'angle', 'theta', 'radius', 'dx', 'dy',               // text
  'font', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant'  // font
];

function toJSON(scene, indent) {
  return JSON.stringify(scene, keys, indent);
}

function fromJSON(json) {
  var scene = (typeof json === 'string' ? JSON.parse(json) : json);
  return initialize(scene);
}

function initialize(scene) {
  var type = scene.marktype,
      i, n, s, m, items;

  for (s=0, m=sets.length; s<m; ++s) {
    if ((items = scene[sets[s]])) {
      for (i=0, n=items.length; i<n; ++i) {
        items[i][type ? 'mark' : 'group'] = scene;
        if (!type || type === 'group') {
          initialize(items[i]);
        }
      }
    }
  }

  if (type) bound.mark(scene);
  return scene;
}

module.exports = {
  toJSON:   toJSON,
  fromJSON: fromJSON
};