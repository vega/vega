// Shared scenegraph-inspection helpers for tests that need to sample
// rendered pixels for individual marks (rather than the whole canvas).

// Walk up a scenegraph item's ancestor GROUP items (via the mark->group
// back-reference vega-scenegraph maintains) to accumulate the offsets that
// item.bounds does not include (bounds are local to the item's immediate
// parent group only).
export function ancestorOffset(item) {
  let x = 0, y = 0, group = item.mark && item.mark.group;
  while (group) {
    x += group.x || 0;
    y += group.y || 0;
    group = group.mark && group.mark.group;
  }
  return {x, y};
}

// Absolute (rendered-surface) pixel bounds of a scenegraph item, accounting
// for the view's padding + autosize origin plus every ancestor group's
// local offset -- matches the translate chain the SVG/Canvas renderers emit.
export function absoluteBounds(view, item) {
  const {x: ox, y: oy} = ancestorOffset(item);
  const pad = view.padding();
  const origin = view.origin();
  const dx = pad.left + origin[0] + ox;
  const dy = pad.top + origin[1] + oy;
  return {
    x1: item.bounds.x1 + dx, x2: item.bounds.x2 + dx,
    y1: item.bounds.y1 + dy, y2: item.bounds.y2 + dy
  };
}

// Count non-white, non-transparent pixels within a pixel-space box on a
// canvas 2d context.
export function countInk(ctx, x1, y1, x2, y2) {
  const x = Math.max(0, Math.floor(x1)), y = Math.max(0, Math.floor(y1));
  const w = Math.max(1, Math.ceil(x2) - x), h = Math.max(1, Math.ceil(y2) - y);
  const data = ctx.getImageData(x, y, w, h).data;
  let ink = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0 && !(data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255)) ink++;
  }
  return ink;
}

// Collect all mark items of a given role, recursively, from a scenegraph
// root (or any group/mark node within it).
export function findByRole(node, role, out = []) {
  if (node.marktype) {
    if (node.role === role) out.push(...node.items);
    (node.items || []).forEach(child => findByRole(child, role, out));
  } else {
    (node.items || []).forEach(mark => findByRole(mark, role, out));
  }
  return out;
}

// Collect all mark items of a given marktype, recursively, from a
// scenegraph root (or any group/mark node within it).
export function findByMarktype(node, marktype, out = []) {
  if (node.marktype === marktype) out.push(...node.items);
  (node.items || []).forEach(child => findByMarktype(child, marktype, out));
  return out;
}
