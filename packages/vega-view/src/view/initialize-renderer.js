import {width, height, offset} from './render-size';

export default function(view, r, el, constructor) {
  r = r || new constructor(view.loader());
  return r
    .initialize(el, width(view), height(view), offset(view))
    .background(view._background);
}
