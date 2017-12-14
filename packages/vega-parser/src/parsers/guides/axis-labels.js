import {Top, Bottom, Left, Right, Label, Value, GuideLabelStyle} from './constants';
import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {AxisLabelRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';
import {value} from '../../util';

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
      scale = spec.scale,
      pad = value(spec.labelPadding, config.labelPadding),
      bound = value(spec.labelBound, config.labelBound),
      flush = value(spec.labelFlush, config.labelFlush),
      flushOn = flush != null && flush !== false && (flush = +flush) === flush,
      flushOffset = +value(spec.labelFlushOffset, config.labelFlushOffset),
      overlap = value(spec.labelOverlap, config.labelOverlap),
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'angle', config.labelAngle);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'fontWeight', config.labelFontWeight);
  addEncode(enter, 'limit', config.labelLimit);

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(pad);
  tickSize.offset.mult = sign;

  tickPos = {
    scale:  scale,
    field:  Value,
    band:   0.5,
    offset: config.tickOffset
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    addEncode(update, 'align', flushOn
      ? flushExpr(scale, flush, '"left"', '"right"', '"center"')
      : 'center');
    if (flushOn && flushOffset) {
      addEncode(update, 'dx', flushExpr(scale, flush, -flushOffset, flushOffset, 0));
    }

    addEncode(update, 'baseline', orient === Top ? 'bottom' : 'top');
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    addEncode(update, 'align', orient === Right ? 'left' : 'right');
    addEncode(update, 'baseline', flushOn
      ? flushExpr(scale, flush, '"bottom"', '"top"', '"middle"')
      : 'middle');
    if (flushOn && flushOffset) {
      addEncode(update, 'dy', flushExpr(scale, flush, flushOffset, -flushOffset, 0));
    }
  }

  spec = guideMark(TextMark, AxisLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
  if (overlap || bound) {
    spec.overlap = {
      method: overlap,
      order:  'datum.index',
      bound:  bound ? {scale: scale, orient: orient, tolerance: +bound} : null
    };
  }
  return spec;
}
