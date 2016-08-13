import fill from './fill';
import stroke from './stroke';
import {forward} from '../iterate';

function drawPathOne(path, context, item, items) {
  if (path(context, items)) return;

  var opacity = item.opacity == null ? 1 : item.opacity;
  if (opacity === 0) return;

  if (item.fill && fill(context, item, opacity)) {
    context.fill();
  }
  if (item.stroke && stroke(context, item, opacity)) {
    context.stroke();
  }
}

function drawPathAll(path, context, scene, bounds) {
  forward(scene.items, function(item) {
    if (!bounds || bounds.intersects(item.bounds)) {
      drawPathOne(path, context, item, item);
    }
  });
}

export function drawAll(pathFunc) {
  return function(context, scene, bounds) {
    drawPathAll(pathFunc, context, scene, bounds);
  };
}

export function drawOne(pathFunc) {
  return function(context, scene, bounds) {
    if (!scene.items.length) return;
    if (!bounds || bounds.intersects(scene.bounds)) {
      drawPathOne(pathFunc, context, scene.items[0], scene.items);
    }
  };
}
