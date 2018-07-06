import {Top, Bottom, Left, Right, Label, Value, GuideLabelStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {AxisLabelRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';

function flushExpr(scale, threshold, a, b, c) {
  return {
    signal: 'flush(range("' + scale + '"), '
      + 'scale("' + scale + '", datum.value), '
      + threshold + ',' + a + ',' + b + ',' + c + ')'
  };
}

export default function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      isX = (orient === Top || orient === Bottom),
      scale = spec.scale,
      flush = lookup('labelFlush', spec, config),
      flushOn = flush != null && flush !== false && (flush = +flush) === flush,
      flushOffset = +lookup('labelFlushOffset', spec, config),
      labelAlign = lookup('labelAlign', spec, config),
      labelBaseline = lookup('labelBaseline', spec, config),
      zero = {value: 0},
      encode, enter, tickSize, tickPos, align, baseline, dx, dy, bound, overlap;

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(lookup('labelPadding', spec, config) || 0);
  tickSize.offset.mult = sign;

  tickPos = {
    scale:  scale,
    field:  Value,
    band:   0.5,
    offset: lookup('tickOffset', spec, config)
  };

  if (isX) {
    align = labelAlign || (flushOn
      ? flushExpr(scale, flush, '"left"', '"right"', '"center"')
      : 'center');

    baseline = labelBaseline || (orient === Top ? 'bottom' : 'top');

    dx = !labelAlign && flushOn && flushOffset
      ? flushExpr(scale, flush, -flushOffset, flushOffset, 0)
      : null;
  } else {
    align = labelAlign || (orient === Right ? 'left' : 'right');

    baseline = labelBaseline || (flushOn
      ? flushExpr(scale, flush, '"top"', '"bottom"', '"middle"')
      : 'middle');

    dy = !labelAlign && flushOn && flushOffset
      ? flushExpr(scale, flush, flushOffset, -flushOffset, 0)
      : null;
  }

  encode = {
    enter: enter = {
      opacity: zero,
      x: isX ? tickPos : tickSize,
      y: isX ? tickSize : tickPos
    },
    update: {
      opacity: {value: 1},
      text: {field: Label},
      x: enter.x,
      y: enter.y
    },
    exit: {
      opacity: zero,
      x: enter.x,
      y: enter.y
    }
  };

  addEncode(encode, 'align',       align);
  addEncode(encode, 'baseline',    baseline);
  addEncode(encode, 'dx',          dx);
  addEncode(encode, 'dy',          dy);
  addEncode(encode, 'angle',       lookup('labelAngle', spec, config));
  addEncode(encode, 'fill',        lookup('labelColor', spec, config));
  addEncode(encode, 'font',        lookup('labelFont', spec, config));
  addEncode(encode, 'fontSize',    lookup('labelFontSize', spec, config));
  addEncode(encode, 'fontWeight',  lookup('labelFontWeight', spec, config));
  addEncode(encode, 'limit',       lookup('labelLimit', spec, config));
  addEncode(encode, 'fillOpacity', lookup('labelOpacity', spec, config));
  bound   = lookup('labelBound', spec, config);
  overlap = lookup('labelOverlap', spec, config);

  spec = guideMark(TextMark, AxisLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);

  // if overlap method or bound defined, request label overlap removal
  if (overlap || bound) {
    spec.overlap = {
      method: overlap,
      order:  'datum.index',
      bound:  bound ? {scale: scale, orient: orient, tolerance: +bound} : null
    };
  }

  return spec;
}
