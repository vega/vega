import {hasCornerRadius, rectangle} from '../../path/shapes';
import {isFunction} from 'vega-util';

let clip_id = 1;

export function resetSVGClipId() {
  clip_id = 1;
}

export default function (renderer, item, size) {
  const clip = item.clip;
  const defs = renderer._defs;
  const id = item.clip_id || (item.clip_id = 'clip' + clip_id++);
  const c = defs.clipping[id] || (defs.clipping[id] = {id: id});

  if (isFunction(clip)) {
    c.path = clip(null);
  } else if (hasCornerRadius(size)) {
    c.path = rectangle(null, size, 0, 0);
  } else {
    c.width = size.width || 0;
    c.height = size.height || 0;
  }

  return 'url(#' + id + ')';
}
