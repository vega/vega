import {markBitmaps} from './util/markBitmaps';
import scaler from './util/scaler';
import placeAreaLabel from './util/placeAreaLabel';
import placeMarkLabel from './util/placeMarkLabel';

// 8-bit representation of anchors
const TOP    = 0x0,
      MIDDLE = 0x1 << 0x2,
      BOTTOM = 0x2 << 0x2,
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

export default function(texts, size, compare, offset, anchor,
  avoidMarks, avoidBaseMark, lineAnchor, markIndex, padding)
{
  if (!texts.length) return texts;
  const positions = Math.max(offset.length, anchor.length),
        offsets = getOffsets(offset, positions),
        anchors = getAnchors(anchor, positions),
        marktype = markType(texts[0].datum),
        grouptype = marktype === 'group' && texts[0].datum.items[markIndex].marktype,
        isGroupArea = grouptype === 'area',
        boundary = markBoundary(marktype, grouptype, lineAnchor, markIndex),
        $ = scaler(size[0], size[1], padding);

  // prepare text mark data for placing
  const data = texts.map(d => ({
    datum: d,
    opacity: 0,
    x: undefined,
    y: undefined,
    align: undefined,
    baseline: undefined,
    boundary: boundary(d)
  }));

  if (compare) {
    data.sort((a, b) => compare(a.datum, b.datum));
  }

  // flag indicating if label can be placed inside its base mark
  let labelInside = false;
  for (let i=0; i < anchors.length && !labelInside; ++i) {
    // label inside if anchor is at center
    // label inside if offset to be inside the mark bound
    labelInside |= anchors[i] === 0x5 || offsets[i] < 0;
  }

  // extract data information from base mark when base mark is to be avoided
  // base mark is implicitly avoided if it is a group area
  if (marktype && (avoidBaseMark || isGroupArea)) {
    avoidMarks = [texts.map(d => d.datum)].concat(avoidMarks);
  }

  // generate bitmaps for layout calculation
  const bitmaps = avoidMarks.length
    ? markBitmaps($, avoidMarks, labelInside, isGroupArea)
    : baseBitmaps($, avoidBaseMark && data);

  // generate label placement function
  const place = isGroupArea
      ? placeAreaLabel($, bitmaps, avoidBaseMark)
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

function baseBitmaps($, data) {
  const bitmap = $.bitmap();
  // when there is no base mark but data points are to be avoided
  (data || []).forEach(d => bitmap.set($(d.boundary[0]), $(d.boundary[3])));
  return [bitmap, undefined];
}

/**
 * Factory function for function for getting base mark boundary, depending
 * on mark and group type. When mark type is undefined, line or area: boundary
 * is the coordinate of each data point. When base mark is grouped line,
 * boundary is either at the beginning or end of the line depending on the
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
        ? items[lineAnchor === 'begin' ? items.length - 1 : 0]
        : {x: Number.MIN_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER});
    };
  }

  else {
    return d => {
      const b = d.datum.bounds;
      return [b.x1, (b.x1 + b.x2) / 2, b.x2, b.y1, (b.y1 + b.y2) / 2, b.y2];
    };
  }
}
