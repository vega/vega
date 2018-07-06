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
      zero = {value: 0},
      encode, enter, update, titlePos;

  encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: {value: 1},
      text: encoder(spec.title)
    },
    exit: {
      opacity: zero
    }
  };

  titlePos = {
    scale: spec.scale,
    range: 0.5
  };

  if (horizontal) {
    update.x = titlePos;
    enter.angle = {value: 0};
    enter.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    enter.angle = {value: sign * 90};
    enter.baseline = {value: 'bottom'};
  }

  addEncode(encode, 'align',       lookup('titleAlign', spec, config));
  addEncode(encode, 'angle',       lookup('titleAngle', spec, config));
  addEncode(encode, 'baseline',    lookup('titleBaseline', spec, config));
  addEncode(encode, 'fill',        lookup('titleColor', spec, config));
  addEncode(encode, 'font',        lookup('titleFont', spec, config));
  addEncode(encode, 'fontSize',    lookup('titleFontSize', spec, config));
  addEncode(encode, 'fontWeight',  lookup('titleFontWeight', spec, config));
  addEncode(encode, 'limit',       lookup('titleLimit', spec, config));
  addEncode(encode, 'fillOpacity', lookup('titleOpacity', spec, config));

  !addEncode(encode, 'x', lookup('titleX', spec, config), 'update')
    && horizontal && !has('x', userEncode)
    && (encode.enter.auto = {value: true});

  !addEncode(encode, 'y', lookup('titleY', spec, config), 'update')
    && !horizontal && !has('y', userEncode)
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
