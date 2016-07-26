import boundMark from '../bound/boundMark';

var keys = [
  'marktype', 'name', 'interactive', 'clip', 'items',
  'x', 'y', 'width', 'height', 'align', 'baseline',             // layout
  'fill', 'fillOpacity', 'opacity',                             // fill
  'stroke', 'strokeOpacity', 'strokeWidth', 'strokeCap',        // stroke
  'strokeDash', 'strokeDashOffset',                             // stroke dash
  'startAngle', 'endAngle', 'innerRadius', 'outerRadius',       // arc
  'cornerRadius', 'padAngle',                                   // arc, rect
  'interpolate', 'tension', 'orient', 'defined',                // area, line
  'url',                                                        // image
  'path',                                                       // path
  'x2', 'y2',                                                   // rule
  'size', 'shape',                                              // symbol
  'text', 'angle', 'theta', 'radius', 'dx', 'dy',               // text
  'font', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant'  // font
];

export function toJSON(scene, indent) {
  return JSON.stringify(scene, keys, indent);
}

export function fromJSON(json) {
  var scene = (typeof json === 'string' ? JSON.parse(json) : json);
  return initialize(scene);
}

function initialize(scene) {
  var type = scene.marktype,
      items = scene.items,
      i, n;

  if (items) {
    for (i=0, n=items.length; i<n; ++i) {
      items[i][type ? 'mark' : 'group'] = scene;
      if (!type || type === 'group') {
        initialize(items[i]);
      }
    }
  }

  if (type) boundMark(scene);
  return scene;
}
