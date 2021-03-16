import {Transform} from 'vega-dataflow';
import {error, fastmap, inherits} from 'vega-util';

const sourceX = t => t.source.x;
const sourceY = t => t.source.y;
const targetX = t => t.target.x;
const targetY = t => t.target.y;

 /**
  * Layout paths linking source and target elements.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
export default function LinkPath(params) {
  Transform.call(this, {}, params);
}

LinkPath.Definition = {
  'type': 'LinkPath',
  'metadata': {'modifies': true},
  'params': [
    { 'name': 'sourceX', 'type': 'field', 'default': 'source.x' },
    { 'name': 'sourceY', 'type': 'field', 'default': 'source.y' },
    { 'name': 'targetX', 'type': 'field', 'default': 'target.x' },
    { 'name': 'targetY', 'type': 'field', 'default': 'target.y' },
    { 'name': 'orient', 'type': 'enum', 'default': 'vertical',
      'values': ['horizontal', 'vertical', 'radial'] },
    { 'name': 'shape', 'type': 'enum', 'default': 'line',
      'values': ['line', 'arc', 'curve', 'diagonal', 'orthogonal'] },
    { 'name': 'require', 'type': 'signal' },
    { 'name': 'as', 'type': 'string', 'default': 'path' }
  ]
};

inherits(LinkPath, Transform, {
  transform(_, pulse) {
    var sx = _.sourceX || sourceX;
    var sy = _.sourceY || sourceY;
    var tx = _.targetX || targetX;
    var ty = _.targetY || targetY;
    var as = _.as || 'path';
    var orient = _.orient || 'vertical';
    var shape = _.shape || 'line';
    var path = Paths.get(shape + '-' + orient) || Paths.get(shape);

    if (!path) {
      error('LinkPath unsupported type: ' + _.shape
        + (_.orient ? '-' + _.orient : ''));
    }

    pulse.visit(pulse.SOURCE, t => {
      t[as] = path(sx(t), sy(t), tx(t), ty(t));
    });

    return pulse.reflow(_.modified()).modifies(as);
  }
});

const line = (sx, sy, tx, ty) =>
  'M' + sx + ',' + sy +
  'L' + tx + ',' + ty;

const lineR= (sa, sr, ta, tr) => line(
  sr * Math.cos(sa), sr * Math.sin(sa),
  tr * Math.cos(ta), tr * Math.sin(ta)
);

const arc = (sx, sy, tx, ty) => {
  var dx = tx - sx;
  var dy = ty - sy;
  var rr = Math.sqrt(dx * dx + dy * dy) / 2;
  var ra = 180 * Math.atan2(dy, dx) / Math.PI;
  return 'M' + sx + ',' + sy +
         'A' + rr + ',' + rr +
         ' ' + ra + ' 0 1' +
         ' ' + tx + ',' + ty;
};

const arcR = (sa, sr, ta, tr) => arc(
  sr * Math.cos(sa), sr * Math.sin(sa),
  tr * Math.cos(ta), tr * Math.sin(ta)
);

const curve = (sx, sy, tx, ty) => {
  const dx = tx - sx;
  const dy = ty - sy;
  const ix = 0.2 * (dx + dy);
  const iy = 0.2 * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
};

const curveR = (sa, sr, ta, tr) => curve(
  sr * Math.cos(sa), sr * Math.sin(sa),
  tr * Math.cos(ta), tr * Math.sin(ta)
);

const orthoX = (sx, sy, tx, ty) =>
  'M' + sx + ',' + sy +
  'V' + ty + 'H' + tx;

const orthoY = (sx, sy, tx, ty) =>
  'M' + sx + ',' + sy +
  'H' + tx + 'V' + ty;

const orthoR = (sa, sr, ta, tr) => {
  const sc = Math.cos(sa);
  const ss = Math.sin(sa);
  const tc = Math.cos(ta);
  const ts = Math.sin(ta);
  const sf = Math.abs(ta - sa) > Math.PI ? ta <= sa : ta > sa;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'A' + sr + ',' + sr + ' 0 0,' + (sf?1:0) +
         ' ' + (sr*tc) + ',' + (sr*ts) +
         'L' + (tr*tc) + ',' + (tr*ts);
};

const diagonalX = (sx, sy, tx, ty) => {
  const m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
};

const diagonalY = (sx, sy, tx, ty) => {
  const m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy +
         'C' + sx + ',' + m +
         ' ' + tx + ',' + m +
         ' ' + tx + ',' + ty;
};

const diagonalR = (sa, sr, ta, tr) => {
  const sc = Math.cos(sa);
  const ss = Math.sin(sa);
  const tc = Math.cos(ta);
  const ts = Math.sin(ta);
  const mr = (sr + tr) / 2;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'C' + (mr*sc) + ',' + (mr*ss) +
         ' ' + (mr*tc) + ',' + (mr*ts) +
         ' ' + (tr*tc) + ',' + (tr*ts);
};

const Paths = fastmap({
  'line': line,
  'line-radial': lineR,
  'arc': arc,
  'arc-radial': arcR,
  'curve': curve,
  'curve-radial': curveR,
  'orthogonal-horizontal': orthoX,
  'orthogonal-vertical': orthoY,
  'orthogonal-radial': orthoR,
  'diagonal-horizontal': diagonalX,
  'diagonal-vertical': diagonalY,
  'diagonal-radial': diagonalR
});
