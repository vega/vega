import {hasCornerRadius, rectangle} from '../../path/shapes.js';
import {isFunction} from 'vega-util';


export default function(renderer, item, size) {
  var clip = item.clip,
      c = {};

  if (isFunction(clip)) {
    c.path = clip(null);
  } else if (hasCornerRadius(size)) {
    c.path = rectangle(null, size, 0, 0);
  } else {
    c.width = size.width || 0;
    c.height = size.height || 0;
  }
  if (c.path){
    return `path(${c.path}) view-box`;
  } else {
    return `xywh(0 0 ${c.width} ${c.height}) view-box`;
  }
}
