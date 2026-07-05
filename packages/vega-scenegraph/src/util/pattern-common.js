// Renderer-agnostic pattern helpers shared by SVG and Canvas.

export function normalizeRepeat(repeat) {
  // canonical spec repeat -> {x: boolean, y: boolean}
  return repeat === true ? {x: true, y: true}
    : repeat === 'x' ? {x: true, y: false}
    : repeat === 'y' ? {x: false, y: true}
    : {x: false, y: false};
}

// Compute a contained rectangle within a box (boxW x boxH) that maintains the
// tile's aspect ratio (tileW x tileH) and applies a uniform padding scale
// (pad in 0..1). Returns {x, y, width, height} in box units, centered.
export function computeContainRect(boxW, boxH, tileW, tileH, pad = 1) {
  let w = boxW, h = boxH;
  if (tileW && tileH) {
    const aspect = tileW / tileH;
    const box = boxW / boxH;
    if (box < aspect) { h = boxW / aspect; } else { w = boxH * aspect; }
  }
  w *= pad; h *= pad;
  const x = (boxW - w) / 2;
  const y = (boxH - h) / 2;
  return {x, y, width: w, height: h};
}

// single decision point for both mark-driven pattern adjustments (design
// spec §6): legend swatches get a derived canonical spec with fit:'swatch';
// paint code renders what it's told.
//
// Text and rule marks are frame-matched on Canvas by translating the drawing
// context to the item's own origin before painting (see marks/text.js,
// marks/rule.js) — the same move SVG gets for free from userSpaceOnUse
// pattern resolution in the referencing element's transformed space. That
// translate already makes text/rule mark-anchored by construction, so a
// spec with origin:'mark' would double-anchor: patternFill's mark-anchor
// layout (computed from item.x/item.bounds) would apply on top of a frame
// that is already local to the item, landing the anchor in the wrong space.
// Forcing origin to 'view' (a no-op offset) for these two marktypes keeps
// them mark-anchored via the translate alone, exactly once.
export function resolveItemPattern(item, spec) {
  const mark = item && item.mark;
  let out = spec;

  const marktype = mark && mark.marktype;
  if ((marktype === 'text' || marktype === 'rule') && out.origin === 'mark') {
    out = {...out, origin: 'view'};
  }

  if (mark && mark.role === 'legend-symbol' && out.fit !== 'swatch') {
    out = {...out, fit: 'swatch'};
  }

  return out;
}
