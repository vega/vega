import {Bottom, End, Group, Left, Right, Start, Top} from '../constants';
import {set, tempBounds} from './util';

export function titleLayout(view, mark, width, height, viewBounds) {
  var group = mark.items[0];
  var frame = group.frame;
  var orient = group.orient;
  var anchor = group.anchor;
  var offset = group.offset;
  var padding = group.padding;
  var title = group.items[0].items[0];
  var subtitle = group.items[1] && group.items[1].items[0];
  var end = (orient === Left || orient === Right) ? height : width;
  var start = 0;
  var x = 0;
  var y = 0;
  var sx = 0;
  var sy = 0;
  var pos;

  if (frame !== Group) {
    orient === Left ? (start = viewBounds.y2, end = viewBounds.y1)
      : orient === Right ? (start = viewBounds.y1, end = viewBounds.y2)
      : (start = viewBounds.x1, end = viewBounds.x2);
  } else if (orient === Left) {
    start = height, end = 0;
  }

  pos = (anchor === Start) ? start
    : (anchor === End) ? end
    : (start + end) / 2;

  if (subtitle && subtitle.text) {
    // position subtitle
    switch (orient) {
      case Top:
      case Bottom:
        sy = title.bounds.height() + padding;
        break;
      case Left:
        sx = title.bounds.width() + padding;
        break;
      case Right:
        sx = -title.bounds.width() - padding;
        break;
    }

    tempBounds.clear().union(subtitle.bounds);
    tempBounds.translate(sx - (subtitle.x || 0), sy - (subtitle.y || 0));
    if (set(subtitle, 'x', sx) | set(subtitle, 'y', sy)) {
      view.dirty(subtitle);
      subtitle.bounds.clear().union(tempBounds);
      subtitle.mark.bounds.clear().union(tempBounds);
      view.dirty(subtitle);
    }

    tempBounds.clear().union(subtitle.bounds);
  } else {
    tempBounds.clear();
  }
  tempBounds.union(title.bounds);

  // position title group
  switch (orient) {
    case Top:
      x = pos;
      y = viewBounds.y1 - tempBounds.height() - offset;
      break;
    case Left:
      x = viewBounds.x1 - tempBounds.width() - offset;
      y = pos;
      break;
    case Right:
      x = viewBounds.x2 + tempBounds.width() + offset;
      y = pos;
      break;
    case Bottom:
      x = pos;
      y = viewBounds.y2 + offset;
      break;
    default:
      x = group.x;
      y = group.y;
  }

  if (set(group, 'x', x) | set(group, 'y', y)) {
    tempBounds.translate(x, y);
    view.dirty(group);
    group.bounds.clear().union(tempBounds);
    mark.bounds.clear().union(tempBounds);
    view.dirty(group);
  }
  return group.bounds;
}
