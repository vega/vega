import {Top, Bottom, Left, GuideTitleStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {encoder, has} from '../encode/encode-util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';
import {addEncode, addEncoders} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      orient = spec.orient,
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

  addEncoders(encode, {
    align:       _('titleAlign'),
    angle:       _('titleAngle'),
    baseline:    _('titleBaseline'),
    fill:        _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font:        _('titleFont'),
    fontSize:    _('titleFontSize'),
    fontStyle:   _('titleFontStyle'),
    fontWeight:  _('titleFontWeight'),
    limit:       _('titleLimit')
  });

  !addEncode(encode, 'x', _('titleX'), 'update')
    && horizontal && !has('x', userEncode)
    && (encode.enter.auto = {value: true});

  !addEncode(encode, 'y', _('titleY'), 'update')
    && !horizontal && !has('y', userEncode)
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
