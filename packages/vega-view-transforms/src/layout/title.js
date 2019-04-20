import {Top, Bottom, Left, Right, Start, End, Group} from '../constants';
import {set, tempBounds} from './util';

export function titleLayout(view, title, width, height, viewBounds) {
  var item = title.items[0],
      frame = item.frame,
      orient = item.orient,
      anchor = item.anchor,
      offset = item.offset,
      bounds = item.bounds,
      vertical = (orient === Left || orient === Right),
      start = 0,
      end = vertical ? height : width,
      x = 0, y = 0, pos;

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

  tempBounds.clear().union(bounds);

  // position title text
  switch (orient) {
    case Top:
      x = pos;
      y = viewBounds.y1 - offset;
      break;
    case Left:
      x = viewBounds.x1 - offset;
      y = pos;
      break;
    case Right:
      x = viewBounds.x2 + offset;
      y = pos;
      break;
    case Bottom:
      x = pos;
      y = viewBounds.y2 + offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }

  bounds.translate(x - (item.x || 0), y - (item.y || 0));
  if (set(item, 'x', x) | set(item, 'y', y)) {
    item.bounds = tempBounds;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  // update bounds
  return title.bounds.clear().union(bounds);
}
