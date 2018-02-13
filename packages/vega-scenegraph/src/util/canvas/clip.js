import {isFunction} from 'vega-util';

export default function(context, scene) {
  var clip = scene.clip;

  context.save();
  context.beginPath();

  if (isFunction(clip)) {
    clip(context);
  } else {
    var group = scene.group;
    context.rect(0, 0, group.width || 0, group.height || 0);
  }

  context.clip();
}
