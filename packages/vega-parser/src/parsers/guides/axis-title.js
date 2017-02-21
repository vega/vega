import {Top, Bottom, Left} from './constants';
import guideMark from './guide-mark';
import {has} from '../encode/encode-util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      title = spec.title,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      encode = {}, enter, update, titlePos;

  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
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

  addEncode(update, 'angle', config.titleAngle);
  addEncode(update, 'baseline', config.titleBaseline);

  !addEncode(update, 'x', config.titleX)
    && horizontal && !has(userEncode, 'x')
    && (encode.enter.auto = {value: true});

  !addEncode(update, 'y', config.titleY)
    && !horizontal && !has(userEncode, 'y')
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, null, dataRef, encode, userEncode);
}
