import {hasCornerRadius, rectangleWithContract} from '../../path/shapes';
import {isFunction} from 'vega-util';

var clip_id = 1;

export function resetSVGClipId() {
  clip_id = 1;
}

export default function(renderer, item, size, offset) {
  var clip = item.clip,
      sw = item.stroke ? (item.strokeWidth || 1) : 0,
      defs = renderer._defs,
      id = item.clip_id || (item.clip_id = 'clip' + clip_id++),
      c = defs.clipping[id] || (defs.clipping[id] = {id: id});

  if (isFunction(clip)) {
    c.path = clip(null);
  } else if (hasCornerRadius(size)) {
    c.path = rectangleWithContract(null, size, 0, 0, sw);
  } else {
    c.x = sw / 2 + offset;
    c.y = sw / 2 + offset;
    c.width = Math.max(0, (size.width || 0) - sw);
    c.height = Math.max(0, (size.height || 0) - sw);
    delete c.path;
  }

  return 'url(#' + id + ')';
}
