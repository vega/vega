import {hasCornerRadius, rectangleWithContract} from '../../path/shapes';
import {isFunction} from 'vega-util';

export default function(context, scene) {
  var clip = scene.clip;

  context.save();

  if (isFunction(clip)) {
    context.beginPath();
    clip(context);
    context.clip();
  } else {
    clipGroup(context, scene.group);
  }
}

export function clipGroup(context, group, offset) {
  var sw = group.stroke ? (group.strokeWidth || 1) : 0;
  context.beginPath();
  hasCornerRadius(group)
    ? rectangleWithContract(context, group, offset, offset, sw)
    : context.rect(
        sw / 2 + offset, sw / 2 + offset,
        Math.max(0, (group.width || 0) - sw), Math.max(0, (group.height || 0) - sw)
      );
  context.clip();
}
