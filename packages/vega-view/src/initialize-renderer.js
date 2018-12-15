import {width, height, offset} from './render-size';

export default function(view, r, el, constructor, scaleFactor, opt) {
  r = r || new constructor(view.loader());
  return r
    .initialize(el, width(view), height(view), offset(view), scaleFactor, opt)
    .background(view._background);
}
