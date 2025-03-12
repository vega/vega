import {one, zero} from './constants.js';
import guideMark from './guide-mark.js';
import {lookup} from './guide-util.js';
import {addEncoders, encoder} from '../encode/util.js';
import {RectMark} from '../marks/marktypes.js';
import {LegendGradientRole} from '../marks/roles.js';
import {extend} from 'vega-util';

export default function(spec, scale, config, userEncode) {
  const _ = lookup(spec, config),
        vertical = _.isVertical(),
        thickness = _.gradientThickness(),
        length = _.gradientLength();

  let enter, start, stop, width, height;

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
    enter: enter = {
      opacity: zero,
      x: zero,
      y: zero,
      width: encoder(width),
      height: encoder(height)
    },
    update: extend({}, enter, {
      opacity: one,
      fill: {gradient: scale, start: start, stop: stop}
    }),
    exit: {
      opacity: zero
    }
  };

  addEncoders(encode, {
    stroke:      _('gradientStrokeColor'),
    strokeWidth: _('gradientStrokeWidth')
  }, { // update
    opacity:     _('gradientOpacity')
  });

  return guideMark({
    type: RectMark,
    role: LegendGradientRole,
    encode
  }, userEncode);
}
