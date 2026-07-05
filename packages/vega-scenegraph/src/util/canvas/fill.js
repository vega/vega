import color from './color.js';

export default function(context, item, opacity, renderer) {
  opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.fillStyle = color(context, item, item.fill, renderer);
    return true;
  } else {
    return false;
  }
}
