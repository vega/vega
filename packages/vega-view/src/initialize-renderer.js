import {height, offset, width} from './render-size.js';

export default function(view, r, el, constructor, scaleFactor, opt) {
  r = r || new constructor(view.loader());

  // an explicit per-call scale factor wins over the view-level option
  // (set for OffscreenCanvas, which cannot read devicePixelRatio itself)
  const scale = scaleFactor ?? view._customScaleFactor;

  return r
    .initialize(el, width(view), height(view), offset(view), scale, opt)
    .background(view.background());
}
