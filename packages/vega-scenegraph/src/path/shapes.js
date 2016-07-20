import curves from './curves';
import symbols from './symbols';

import {default as vg_rect} from './rectangle';
import {default as vg_trail} from './trail';

import {
  arc as d3_arc,
  symbol as d3_symbol,
  area as d3_area,
  line as d3_line
} from 'd3-shape';

function x(item)     { return item.x || 0; }
function y(item)     { return item.y || 0; }
function w(item)     { return item.width || 0; }
function wh(item)    { return item.width || item.height || 1; }
function h(item)     { return item.height || 0; }
function xw(item)    { return (item.x || 0) + (item.width || 0); }
function yh(item)    { return (item.y || 0) + (item.height || 0); }
function cr(item)    { return item.cornerRadius || 0; }
function pa(item)    { return item.padAngle || 0; }
function def(item)   { return !(item.defined === false); }
function size(item)  { return item.size == null ? 64 : item.size; }
function type(item) { return symbols(item.shape || 'circle'); }

var arcShape    = d3_arc().cornerRadius(cr).padAngle(pa),
    areavShape  = d3_area().x(x).y1(y).y0(yh).defined(def),
    areahShape  = d3_area().y(y).x1(x).x0(xw).defined(def),
    lineShape   = d3_line().x(x).y(y).defined(def),
    trailShape  = vg_trail().x(x).y(y).defined(def).size(wh),
    rectShape   = vg_rect().x(x).y(y).width(w).height(h).cornerRadius(cr),
    symbolShape = d3_symbol().type(type).size(size);

export function arc(context, item) {
  return arcShape.context(context)(item);
}

export function area(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return (interp === 'trail' ? trailShape
    : (item.orient === 'horizontal' ? areahShape : areavShape)
        .curve(curves(interp, item.orient, item.tension))
  ).context(context)(items);
}

export function shape(context, item) {
  (item.mark.shape || item.shape)
    .context(context)(item);
}

export function line(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return lineShape.curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

export function rectangle(context, item) {
  return rectShape.context(context)(item);
}

export function symbol(context, item) {
  return symbolShape.context(context)(item);
}
