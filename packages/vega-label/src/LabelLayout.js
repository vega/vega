import LabelPlacer from './placers/LabelPlacer';
import AreaLabelPlacer from './placers/AreaLabelPlacer';
import {default as BitMap, prepareBitmap} from './BitMap';

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

export default function(texts, size, sort, offset, anchor,
  avoidMarks, avoidBaseMark, lineAnchor, markIndex, padding)
{
  const n = texts.length;
  if (!n) return texts;

  const data = new Array(n),
        positions = Math.max(offset.length, anchor.length),
        offsets = getOffsets(offset, positions),
        anchors = getAnchors(anchor, positions),
        marktype = markType(texts[0].datum),
        grouptype = marktype === 'group' && texts[0].datum.items[markIndex].marktype,
        boundary = markBoundary(marktype, grouptype, lineAnchor, markIndex),
        opacity = originalOpacity(texts[0]._transformed);

  // prepare text mark data for placing
  for (let i=0; i<n; ++i) {
    const d = texts[i];

    data[i] = {
      textWidth: undefined,
      fontSize: d.fontSize,
      font: d.font,
      text: d.text,
      sort: sort && sort(d.datum),
      markBound: boundary(d),
      _opacity: opacity(d),
      opacity: 0,
      datum: d
    };
  }

  if (sort) {
    // sort field has to be primitive variable type
    data.sort((a, b) => a.sort - b.sort);
  }

  // flag indicating if label can be placed inside its base mark
  let labelInside = false;
  for (let i = 0; i < anchors.length && !labelInside; i++) {
    // label inside if anchor is at center
    // label inside if offset to be inside the mark bound
    labelInside |= anchors[i] === 0x5 || offsets[i] < 0;
  }

  const bitmaps = prepareBitmap(data, size, marktype, avoidBaseMark, avoidMarks, labelInside, padding);
  if (grouptype === 'area') {
    // area marks need another bitmap to find the shape of each area
    bitmaps.push(new BitMap(size[0], size[1], padding));
  }

  const placer = grouptype === 'area'
      ? AreaLabelPlacer(bitmaps, size, avoidBaseMark)
      : LabelPlacer(bitmaps, size, anchors, offsets);

  // place all label
  for (let i=0; i<n; ++i) {
    const d = data[i];
    if (d._opacity !== 0 && placer(d)) {
      d.opacity = d._opacity;
    }
  }

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
 * Factory function for geting original opacity from a data point information.
 * @param {boolean} transformed a boolean flag if data points are already transformed
 *
 * @return a function that return _opacity property of a data point if
 *         transformed. Otherwise, a function that return .opacity property of a data point
 */
function originalOpacity(transformed) {
  return transformed ? d => d._opacity : d => d.opacity;
}

/**
 * Factory function for function for getting base mark boundary, depending on mark and group type.
 * When mark type is undefined, line or area: boundary is the coordinate of each data point.
 * When base mark is grouped line, boundary is either at the beginning or end of the line depending
 * on the value of lineAnchor.
 * Otherwise, use boundary of base mark.
 *
 * @param {string} marktype mark type of base mark (marktype can be undefined if label does not use
 *                          reactive geometry to any other mark)
 * @param {string} grouptype group type of base mark if mark type is 'group' (grouptype can be
 *                           undefined if the base mark is not in group)
 * @param {string} lineAnchor anchor point of group line mark if group type is 'line' can be either
 *                            'begin' or 'end'
 * @param {number} markIndex index of base mark if base mark is in a group with multiple marks
 *
 * @returns function(d) for getting mark boundary from data point information d
 */
function markBoundary(marktype, grouptype, lineAnchor, markIndex) {
  if (!marktype) {
    // no reactive geometry
    return d => [d.x, d.x, d.x, d.y, d.y, d.y];
  }

  else if (marktype === 'line' || marktype === 'area') {
    return d => {
      const dd = d.datum;
      return [dd.x, dd.x, dd.x, dd.y, dd.y, dd.y];
    };
  }

  else if (grouptype === 'line') {
    const endItemIndex = lineAnchor === 'begin' ? m => m - 1 : () => 0;
    return d => {
      const items = d.datum.items[markIndex].items,
            m = items.length;
      if (m) {
        // this line has at least 1 item
        const endItem = items[endItemIndex(m)];
        return [endItem.x, endItem.x, endItem.x, endItem.y, endItem.y, endItem.y];
      } else {
        // empty line
        const minInt = Number.MIN_SAFE_INTEGER;
        return [minInt, minInt, minInt, minInt, minInt, minInt];
      }
    };
  }

  else {
    return d => {
      const b = d.datum.bounds;
      return [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
    };
  }
}
