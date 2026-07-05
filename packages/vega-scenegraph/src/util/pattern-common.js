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

// single decision point for swatch treatment (design spec §6): legend swatches get a
// derived canonical spec with fit:'swatch'; paint code renders what it's told.
export function resolveItemPattern(item, spec) {
  return item && item.mark && item.mark.role === 'legend-symbol' && spec.fit !== 'swatch'
    ? {...spec, fit: 'swatch'}
    : spec;
}
