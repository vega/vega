import {
  Index,
  Label,
  Perc,
  Value,
  GuideLabelStyle,
  zero,
  one,
  Top,
  Bottom,
  Left,
  Right,
  Center,
  Middle
} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import {value} from '../../util';

const alignExpr = `datum.${Perc}<=0?"${Left}":datum.${Perc}>=1?"${Right}":"${Center}"`;
const baselineExpr = `datum.${Perc}<=0?"${Bottom}":datum.${Perc}>=1?"${Top}":"${Middle}"`;

export default function (spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config);
  const vertical = _.isVertical();
  const thickness = encoder(_.gradientThickness());
  const length = _.gradientLength();
  const overlap = _('labelOverlap');
  const separation = _('labelSeparation');
  let enter;
  let update;
  let u;
  let v;
  let adjust = '';

  const encode = {
    enter: (enter = {
      opacity: zero
    }),
    update: (update = {
      opacity: one,
      text: {field: Label}
    }),
    exit: {
      opacity: zero
    }
  };

  addEncoders(encode, {
    fill: _('labelColor'),
    fillOpacity: _('labelOpacity'),
    font: _('labelFont'),
    fontSize: _('labelFontSize'),
    fontStyle: _('labelFontStyle'),
    fontWeight: _('labelFontWeight'),
    limit: value(spec.labelLimit, config.gradientLabelLimit)
  });

  if (vertical) {
    enter.align = {value: 'left'};
    enter.baseline = update.baseline = {signal: baselineExpr};
    u = 'y';
    v = 'x';
    adjust = '1-';
  } else {
    enter.align = update.align = {signal: alignExpr};
    enter.baseline = {value: 'top'};
    u = 'x';
    v = 'y';
  }

  enter[u] = update[u] = {signal: adjust + 'datum.' + Perc, mult: length};

  enter[v] = update[v] = thickness;
  thickness.offset = value(spec.labelOffset, config.gradientLabelOffset) || 0;

  spec = guideMark(TextMark, LegendLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
  if (overlap) {
    spec.overlap = {
      separation: separation,
      method: overlap,
      order: 'datum.' + Index
    };
  }
  return spec;
}
