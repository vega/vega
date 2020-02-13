import {Top, Bottom, Left, Right, Label, Value, GuideLabelStyle, zero, one} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {AxisLabelRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import {deref} from '../../util';

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
      sign = (orient === Left || orient === Top) ? -1 : 1,
      isXAxis = (orient === Top || orient === Bottom),
      scale = spec.scale,
      flush = deref(_('labelFlush')),
      flushOffset = deref(_('labelFlushOffset')),
      flushOn = flush === 0 || !!flush,
      labelAlign = _('labelAlign'),
      labelBaseline = _('labelBaseline'),
      encode, enter, tickSize, tickPos, align, baseline, offset,
      bound, overlap, separation;

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(_('labelPadding') || 0);
  tickSize.offset.mult = sign;

  tickPos = {
    scale:  scale,
    field:  Value,
    band:   0.5,
    offset: band.offset
  };

  if (isXAxis) {
    align = labelAlign || (flushOn
      ? flushExpr(scale, flush, '"left"', '"right"', '"center"')
      : 'center');
    baseline = labelBaseline || (orient === Top ? 'bottom' : 'top');
    offset = !labelAlign;
  } else {
    align = labelAlign || (orient === Right ? 'left' : 'right');
    baseline = labelBaseline || (flushOn
      ? flushExpr(scale, flush, '"top"', '"bottom"', '"middle"')
      : 'middle');
    offset = !labelBaseline;
  }

  offset = offset && flushOn && flushOffset
    ? flushExpr(scale, flush, '-(' + flushOffset + ')', flushOffset, 0)
    : null;

  encode = {
    enter: enter = {
      opacity: zero,
      x: isXAxis ? tickPos : tickSize,
      y: isXAxis ? tickSize : tickPos
    },
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

  addEncoders(encode, {
    [isXAxis ? 'dx' : 'dy']: offset,
    align:       align,
    baseline:    baseline,
    angle:       _('labelAngle'),
    fill:        _('labelColor'),
    fillOpacity: _('labelOpacity'),
    font:        _('labelFont'),
    fontSize:    _('labelFontSize'),
    fontWeight:  _('labelFontWeight'),
    fontStyle:   _('labelFontStyle'),
    limit:       _('labelLimit')
  });

  bound   = _('labelBound');
  overlap = _('labelOverlap');
  separation = _('labelSeparation');

  spec = guideMark(TextMark, AxisLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);

  // if overlap method or bound defined, request label overlap removal
  if (overlap || bound) {
    spec.overlap = {
      separation: separation,
      method: overlap,
      order: 'datum.index',
      bound: bound ? {scale: scale, orient: orient, tolerance: bound} : null
    };
  }

  return spec;
}
