import blend from './blend.js';
import fill from './fill.js';
import stroke from './stroke.js';
import {visit} from '../visit.js';

export function drawAll(path) {
  return function(context, scene, bounds) {
    const renderer = this;
    visit(scene, item => {
      if (!bounds || bounds.intersects(item.bounds)) {
        drawPath(path, context, item, item, renderer);
      }
    });
  };
}

export function drawOne(path) {
  return function(context, scene, bounds) {
    const renderer = this;
    if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
      drawPath(path, context, scene.items[0], scene.items, renderer);
    }
  };
}

function drawPath(path, context, item, items, renderer) {
  var opacity = item.opacity == null ? 1 : item.opacity;
  if (opacity === 0) return;

  if (path(context, items)) return;

  blend(context, item);

  if (item.fill && fill(context, item, opacity, renderer)) {
    context.fill();
  }

  if (item.stroke && stroke(context, item, opacity, renderer)) {
    context.stroke();
  }
}
