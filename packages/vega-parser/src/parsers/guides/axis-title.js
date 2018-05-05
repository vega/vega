import {Top, Bottom, Left, GuideTitleStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {encoder, has} from '../encode/encode-util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      encode = {}, enter, update, titlePos;

  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'align',      lookup('titleAlign', spec, config));
  addEncode(enter, 'fill',       lookup('titleColor', spec, config));
  addEncode(enter, 'font',       lookup('titleFont', spec, config));
  addEncode(enter, 'fontSize',   lookup('titleFontSize', spec, config));
  addEncode(enter, 'fontWeight', lookup('titleFontWeight', spec, config));
  addEncode(enter, 'limit',      lookup('titleLimit', spec, config));

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: encoder(spec.title)
  };

  titlePos = {
    scale: spec.scale,
    range: 0.5
  };

  if (horizontal) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  addEncode(update, 'angle',    lookup('titleAngle', spec, config));
  addEncode(update, 'baseline', lookup('titleBaseline', spec, config));

  !addEncode(update, 'x', lookup('titleX', spec, config))
    && horizontal && !has('x', userEncode)
    && (encode.enter.auto = {value: true});

  !addEncode(update, 'y', lookup('titleY', spec, config))
    && !horizontal && !has('y', userEncode)
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
