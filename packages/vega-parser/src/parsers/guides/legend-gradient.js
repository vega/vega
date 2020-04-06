import {zero, one} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RectMark} from '../marks/marktypes';
import {LegendGradientRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import {extend} from 'vega-util';

export default function (spec, scale, config, userEncode) {
  const _ = lookup(spec, config);
  const vertical = _.isVertical();
  const thickness = _.gradientThickness();
  const length = _.gradientLength();
  let enter;
  let start;
  let stop;
  let width;
  let height;

  if (vertical) {
    start = [0, 1];
    stop = [0, 0];
    width = thickness;
    height = length;
  } else {
    start = [0, 0];
    stop = [1, 0];
    width = length;
    height = thickness;
  }

  const encode = {
    enter: (enter = {
      opacity: zero,
      x: zero,
      y: zero,
      width: encoder(width),
      height: encoder(height)
    }),
    update: extend({}, enter, {
      opacity: one,
      fill: {gradient: scale, start: start, stop: stop}
    }),
    exit: {
      opacity: zero
    }
  };

  addEncoders(
    encode,
    {
      stroke: _('gradientStrokeColor'),
      strokeWidth: _('gradientStrokeWidth')
    },
    {
      // update
      opacity: _('gradientOpacity')
    }
  );

  return guideMark(RectMark, LegendGradientRole, null, undefined, undefined, encode, userEncode);
}
