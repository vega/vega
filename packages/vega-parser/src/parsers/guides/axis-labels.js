import {Top, Bottom, Left, Right, Label, Value, GuideLabelStyle} from './constants';
import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {AxisLabelRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';
import {isNumber} from 'vega-util';

function flushExpr(a, b, c) {
  return {signal:
    'item===item.mark.items[0] ? ' + a
      + ' : item===peek(item.mark.items) ? ' + b
      + ' : ' + c
  };
}

export default function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      scale = spec.scale,
      pad = spec.labelPadding != null ? spec.labelPadding : config.labelPadding,
      bound = spec.labelBound != null ? spec.labelBound : config.labelBound,
      flush = spec.labelFlush != null ? spec.labelFlush : config.labelFlush,
      overlap = spec.labelOverlap != null ? spec.labelOverlap : config.labelOverlap,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'angle', config.labelAngle);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
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
    addEncode(update, 'align', flush
      ? flushExpr('"left"', '"right"', '"center"')
      : 'center');
    if (flush && isNumber(flush)) {
      flush = Math.abs(+flush);
      addEncode(update, 'dx', flushExpr(-flush, flush, 0));
    }

    addEncode(update, 'baseline', orient === Top ? 'bottom' : 'top');
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    addEncode(update, 'align', orient === Right ? 'left' : 'right');
    addEncode(update, 'baseline', flush
      ? flushExpr('"bottom"', '"top"', '"middle"')
      : 'middle');
    if (flush && isNumber(flush)) {
      flush = Math.abs(+flush);
      addEncode(update, 'dy', flushExpr(flush, -flush, 0));
    }
  }

  spec = guideMark(TextMark, AxisLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
  spec.overlapMethod = overlap;
  spec.overlapBound = bound
    ? {scale: scale, orient: orient, tolerance: +bound}
    : null;
  return spec;
}
