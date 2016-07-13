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
function shape(item) { return symbols(item.shape || 'circle'); }

var arcGen    = d3_arc().cornerRadius(cr).padAngle(pa),
    areaVGen  = d3_area().x(x).y1(y).y0(yh).defined(def),
    areaHGen  = d3_area().y(y).x1(x).x0(xw).defined(def),
    lineGen   = d3_line().x(x).y(y).defined(def),
    trailGen  = vg_trail().x(x).y(y).defined(def).size(wh),
    rectGen   = vg_rect().x(x).y(y).width(w).height(h).cornerRadius(cr),
    symbolGen = d3_symbol().type(shape).size(size);

export function arc(context, item) {
  return arcGen.context(context)(item);
}

export function area(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return (interp === 'trail' ? trailGen
    : (item.orient === 'horizontal' ? areaHGen : areaVGen)
        .curve(curves(interp, item.orient, item.tension))
  ).context(context)(items);
}

export function line(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return lineGen.curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

export function rectangle(context, item) {
  return rectGen.context(context)(item);
}

export function symbol(context, item) {
  return symbolGen.context(context)(item);
}
