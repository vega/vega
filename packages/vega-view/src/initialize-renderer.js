import {height, offset, width} from './render-size.js';
import {extend} from 'vega-util';

export default function(view, r, el, constructor, scaleFactor, opt) {
  r = r || new constructor(view.loader());

  const options = view.canvas
    ? extend({canvas: view.canvas}, opt)
    : opt;

  // a view-level scale factor (set for OffscreenCanvas, which cannot read
  // devicePixelRatio itself) takes precedence over the per-call parameter
  const scale = view._customScaleFactor ?? scaleFactor;

  return r
    .initialize(el, width(view), height(view), offset(view), scale, options)
    .background(view.background());
}
