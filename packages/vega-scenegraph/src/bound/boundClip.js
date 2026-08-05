import Bounds from '../Bounds.js';
import boundContext from './boundContext.js';
import {isFunction} from 'vega-util';

const clipBounds = new Bounds();

export default function(mark) {
  const clip = mark.clip;

  if (isFunction(clip)) {
    clip(boundContext(clipBounds.clear()));
  } else if (clip) {
    clipBounds.set(0, 0, mark.group.width, mark.group.height);
  } else return;

  mark.bounds.intersect(clipBounds);
}
