import {textMetrics} from 'vega-scenegraph';
import {baseBitmaps, markBitmaps} from './util/markBitmaps.js';
import scaler from './util/scaler.js';
import placeAreaLabelNaive from './util/placeAreaLabel/placeNaive.js';
import placeAreaLabelReducedSearch from './util/placeAreaLabel/placeReducedSearch.js';
import placeAreaLabelFloodFill from './util/placeAreaLabel/placeFloodFill.js';
import placeMarkLabel from './util/placeMarkLabel.js';

// 8-bit representation of anchors
const TOP    = 0x0,
      MIDDLE = 0x4,
      BOTTOM = 0x8,
      LEFT   = 0x0,
      CENTER = 0x1,
      RIGHT  = 0x2;

// Mapping from text anchor to number representation
const anchorCode = {
  'top-left':     TOP + LEFT,
  'top':          TOP + CENTER,
  'top-right':    TOP + RIGHT,
  'left':         MIDDLE + LEFT,
  'middle':       MIDDLE + CENTER,
  'right':        MIDDLE + RIGHT,
  'bottom-left':  BOTTOM + LEFT,
  'bottom':       BOTTOM + CENTER,
  'bottom-right': BOTTOM + RIGHT
};

const placeAreaLabel = {
  'naive': placeAreaLabelNaive,
  'reduced-search': placeAreaLabelReducedSearch,
  'floodfill': placeAreaLabelFloodFill
};

export default function(texts, size, compare, offset, anchor,
  avoidMarks, avoidBaseMark, lineAnchor, markIndex, padding, method)
{
  // early exit for empty data
  if (!texts.length) return texts;

  const positions = Math.max(offset.length, anchor.length),
        offsets = getOffsets(offset, positions),
        anchors = getAnchors(anchor, positions),
        marktype = markType(texts[0].datum),
        grouptype = marktype === 'group' && texts[0].datum.items[markIndex].marktype,
        isGroupArea = grouptype === 'area',
        boundary = markBoundary(marktype, grouptype, lineAnchor, markIndex),
        infPadding = padding === null || padding === Infinity,
        isNaiveGroupArea = isGroupArea && method === 'naive';

  let maxTextWidth = -1,
      maxTextHeight = -1;

  // prepare text mark data for placing
  const data = texts.map(d => {
    const textWidth = infPadding ? textMetrics.width(d, d.text) : undefined;
    maxTextWidth = Math.max(maxTextWidth, textWidth);
    maxTextHeight = Math.max(maxTextHeight, d.fontSize);

    return {
      datum: d,
      opacity: 0,
      x: undefined,
      y: undefined,
      align: undefined,
      baseline: undefined,
      boundary: boundary(d),
      textWidth
    };
  });

  padding = (padding === null || padding === Infinity)
    ? Math.max(maxTextWidth, maxTextHeight) + Math.max(...offset)
    : padding;
  const $ = scaler(size[0], size[1], padding);

  let bitmaps;
  if (!isNaiveGroupArea) {
    // sort labels in priority order, if comparator is provided
    if (compare) {
      data.sort((a, b) => compare(a.datum, b.datum));
    }

    // flag indicating if label can be placed inside its base mark
    let labelInside = false;
    for (let i=0; i < anchors.length && !labelInside; ++i) {
      // label inside if anchor is at center
      // label inside if offset to be inside the mark bound
      labelInside = anchors[i] === 0x5 || offsets[i] < 0;
    }

    // extract data information from base mark when base mark is to be avoided
    // base mark is implicitly avoided if it is a group area
    const baseMark = ((marktype && avoidBaseMark) || isGroupArea) && texts.map(d => d.datum);

    // generate bitmaps for layout calculation
    bitmaps = avoidMarks.length || baseMark
      ? markBitmaps($, baseMark || [], avoidMarks, labelInside, isGroupArea)
      : baseBitmaps($, avoidBaseMark && data);
  }

  // generate label placement function
  const place = isGroupArea
    ? placeAreaLabel[method]($, bitmaps, avoidBaseMark, markIndex)
    : placeMarkLabel($, bitmaps, anchors, offsets);

  // place all labels
  data.forEach(d => d.opacity = +place(d));

  return data;
}

function getOffsets(_, count) {
  const offsets = new Float64Array(count),
        n = _.length;
  for (let i=0; i<n; ++i) offsets[i] = _[i] || 0;
  for (let i=n; i<count; ++i) offsets[i] = offsets[n - 1];
  return offsets;
}

function getAnchors(_, count) {
  const anchors = new Int8Array(count),
        n = _.length;
  for (let i=0; i<n; ++i) anchors[i] |= anchorCode[_[i]];
  for (let i=n; i<count; ++i) anchors[i] = anchors[n - 1];
  return anchors;
}

function markType(item) {
  return item && item.mark && item.mark.marktype;
}

/**
 * Factory function for function for getting base mark boundary, depending
 * on mark and group type. When mark type is undefined, line or area: boundary
 * is the coordinate of each data point. When base mark is grouped line,
 * boundary is either at the start or end of the line depending on the
 * value of lineAnchor. Otherwise, use bounds of base mark.
 */
function markBoundary(marktype, grouptype, lineAnchor, markIndex) {
  const xy = d => [d.x, d.x, d.x, d.y, d.y, d.y];

  if (!marktype) {
    return xy; // no reactive geometry
  }

  else if (marktype === 'line' || marktype === 'area') {
    return d => xy(d.datum);
  }

  else if (grouptype === 'line') {
    return d => {
      const items = d.datum.items[markIndex].items;
      return xy(items.length
        ? items[lineAnchor === 'start' ? 0 : items.length - 1]
        : {x: NaN, y: NaN});
    };
  }

  else {
    return d => {
      const b = d.datum.bounds;
      return [b.x1, (b.x1 + b.x2) / 2, b.x2, b.y1, (b.y1 + b.y2) / 2, b.y2];
    };
  }
}
