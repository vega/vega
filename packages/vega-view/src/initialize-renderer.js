import {height, offset, width} from './render-size.js';
import {extend} from 'vega-util';

export default function(view, r, el, constructor, scaleFactor, opt) {
  r = r || new constructor(view.loader());

  // Include canvas from view options if provided
  const options = view.canvas
    ? extend({canvas: view.canvas}, opt)
    : opt;

  // Use custom scale factor if provided (for OffscreenCanvas pixel ratio)
  const scale = view._customScaleFactor !== null
    ? view._customScaleFactor
    : scaleFactor;

  return r
    .initialize(el, width(view), height(view), offset(view), scale, options)
    .background(view.background());
}
