import curves from './curves';
import symbols from './symbols';

import {default as vg_rect} from './rectangle';
import {default as vg_trail} from './trail';

import {
  arc as d3_arc,
  area as d3_area,
  line as d3_line,
  symbol as d3_symbol
} from 'd3-shape';

function value(a, b) {
  return a != null ? a : b;
}

const x =  item => item.x || 0;
const y =  item => item.y || 0;
const w =  item => item.width || 0;
const h =  item => item.height || 0;
const xw = item => (item.x || 0) + (item.width || 0);
const yh = item => (item.y || 0) + (item.height || 0);
const sa = item => item.startAngle || 0;
const ea = item => item.endAngle || 0;
const pa = item => item.padAngle || 0;
const ir = item => item.innerRadius || 0;
const or = item => item.outerRadius || 0;
const cr = item => item.cornerRadius || 0;
const tl = item => value(item.cornerRadiusTopLeft, item.cornerRadius) || 0;
const tr = item => value(item.cornerRadiusTopRight, item.cornerRadius) || 0;
const br = item => value(item.cornerRadiusBottomRight, item.cornerRadius) || 0;
const bl = item => value(item.cornerRadiusBottomLeft, item.cornerRadius) || 0;
const sz = item => value(item.size, 64);
const ts = item => item.size || 1;
const def = item => !(item.defined === false);
const type = item => symbols(item.shape || 'circle');

const arcShape    = d3_arc().startAngle(sa).endAngle(ea).padAngle(pa)
                      .innerRadius(ir).outerRadius(or).cornerRadius(cr);
const areavShape  = d3_area().x(x).y1(y).y0(yh).defined(def);
const areahShape  = d3_area().y(y).x1(x).x0(xw).defined(def);
const lineShape   = d3_line().x(x).y(y).defined(def);
const rectShape   = vg_rect().x(x).y(y).width(w).height(h)
                .cornerRadius(tl, tr, br, bl);
const symbolShape = d3_symbol().type(type).size(sz);
const trailShape  = vg_trail().x(x).y(y).defined(def).size(ts);

export function hasCornerRadius(item) {
  return item.cornerRadius
    || item.cornerRadiusTopLeft
    || item.cornerRadiusTopRight
    || item.cornerRadiusBottomRight
    || item.cornerRadiusBottomLeft;
}

export function arc(context, item) {
  return arcShape.context(context)(item);
}

export function area(context, items) {
  const item = items[0];
  const interp = item.interpolate || 'linear';
  return (item.orient === 'horizontal' ? areahShape : areavShape)
    .curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

export function line(context, items) {
  const item = items[0];
  const interp = item.interpolate || 'linear';
  return lineShape.curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

export function rectangle(context, item, x, y) {
  return rectShape.context(context)(item, x, y);
}

export function shape(context, item) {
  return (item.mark.shape || item.shape)
    .context(context)(item);
}

export function symbol(context, item) {
  return symbolShape.context(context)(item);
}

export function trail(context, items) {
  return trailShape.context(context)(items);
}
