import {Bottom, GuideLabelStyle, Label, Left, Right, Top, Value, one, zero} from './constants';
import guideMark from './guide-mark';
import {extendOffset, lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {AxisLabelRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import {deref, isSignal} from '../../util';
import {resolveAxisOrientConditional, resolveXYAxisOrientConditional, xyAxisConditionalEncoding, xyAxisSignalRef} from './axis-util';

function flushExpr(scale, threshold, a, b, c) {
  return {
    signal: 'flush(range("' + scale + '"), '
      + 'scale("' + scale + '", datum.value), '
      + threshold + ',' + a + ',' + b + ',' + c + ')'
  };
}

export default function(spec, config, userEncode, dataRef, size, band) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      sign = resolveAxisOrientConditional([Left, Top], orient, -1, 1),
      isXAxis = (orient === Top || orient === Bottom),
      scale = spec.scale,
      flush = deref(_('labelFlush')),
      flushOffset = deref(_('labelFlushOffset')),
      flushOn = flush === 0 || !!flush,
      labelAlign = _('labelAlign'),
      labelBaseline = _('labelBaseline'),
      encode, enter, tickSize, tickPos, align,
      xLabelAlign, yLabelAlign, xLabelBaseline, yLabelBaseline,
      baseline, offset, bound, overlap, offsetExpr;

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(_('labelPadding') || 0);
  tickSize.offset.mult = sign;

  tickPos = {
    scale:  scale,
    field:  Value,
    band:   0.5,
    offset: extendOffset(band.offset, _('labelOffset'))
  };

  xLabelAlign = flushOn ? flushExpr(scale, flush, '"left"', '"right"', '"center"') : 'center';
  yLabelAlign = resolveAxisOrientConditional(Right, orient, 'left', 'right');
  align = labelAlign || resolveXYAxisOrientConditional('x', orient, xLabelAlign, yLabelAlign);

  xLabelBaseline = resolveAxisOrientConditional('top', orient, 'bottom', 'top');
  yLabelBaseline = flushOn ? flushExpr(scale, flush, '"top"', '"bottom"', '"middle"') : 'middle';
  baseline = labelBaseline || resolveXYAxisOrientConditional('x', orient, xLabelBaseline, yLabelBaseline);

  offsetExpr = flushExpr(scale, flush, '-(' + flushOffset + ')', flushOffset, 0);
  offset = resolveXYAxisOrientConditional(
    'x',
    orient,
    !labelAlign && flushOn && flushOffset ? offsetExpr : null,
    !labelBaseline && flushOn && flushOffset ? offsetExpr : null
  );

  enter = {
    opacity: zero,
    x: isSignal(orient) ?
        xyAxisConditionalEncoding('x', orient.signal, tickPos, tickSize) :
        isXAxis ? tickPos : tickSize,
    y: isSignal(orient) ?
        xyAxisConditionalEncoding('x', orient.signal, tickSize, tickPos) :
        isXAxis ? tickSize : tickPos
  };

  encode = {
    enter: enter,
    update: {
      opacity: one,
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

  if (isSignal(orient)) {
    addEncoders(encode, {
      dx: xyAxisSignalRef('x', orient.signal, offset, null),
      dy: xyAxisSignalRef('y', orient.signal, offset, null)
    });
  } else {
    addEncoders(encode, {
      [isXAxis ? 'dx' : 'dy'] : offset,
    });
  }

  addEncoders(encode, {
    align:       align,
    baseline:    baseline,
    angle:       _('labelAngle'),
    fill:        _('labelColor'),
    fillOpacity: _('labelOpacity'),
    font:        _('labelFont'),
    fontSize:    _('labelFontSize'),
    fontWeight:  _('labelFontWeight'),
    fontStyle:   _('labelFontStyle'),
    limit:       _('labelLimit'),
    lineHeight:  _('labelLineHeight')
  });
    
  bound   = _('labelBound');
  overlap = _('labelOverlap');

  // if overlap method or bound defined, request label overlap removal
  overlap = overlap || bound ? {
    separation: _('labelSeparation'),
    method: overlap,
    order: 'datum.index',
    bound: bound ? {scale, orient, tolerance: bound} : null
  } : undefined;

  return guideMark({
    type:  TextMark,
    role:  AxisLabelRole,
    style: GuideLabelStyle,
    key:   Value,
    from:  dataRef,
    encode,
    overlap
  }, userEncode);
}
