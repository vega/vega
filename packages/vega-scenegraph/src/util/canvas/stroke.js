import color from './color';

var Empty = [];

export default function(context, item, opacity) {
  var lw = (lw = item.strokeWidth) != null ? lw : 1, lc;
  if (lw <= 0) return false;

  opacity *= (item.strokeOpacity==null ? 1 : item.strokeOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.strokeStyle = color(context, item, item.stroke);
    context.lineWidth = lw;
    context.lineCap = (lc = item.strokeCap) != null ? lc : 'butt';
    if (context.setLineDash) {
      context.setLineDash(item.strokeDash || Empty);
      context.lineDashOffset = item.strokeDashOffset || 0;
    }
    return true;
  } else {
    return false;
  }
}
