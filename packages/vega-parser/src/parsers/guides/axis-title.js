import {Top, Bottom, Left, GuideTitleStyle, zero, one} from './constants';
import guideMark from './guide-mark';
import {alignExpr, anchorExpr, lookup} from './guide-util';
import {encoder, has} from '../encode/encode-util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';
import {addEncode, addEncoders} from '../encode/encode-util';
import {extend} from 'vega-util';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      encode, enter, update, titlePos;

  encode = {
    enter: enter = {
      opacity: zero,
      anchor: encoder(_('titleAnchor')),
      align: {signal: alignExpr}
    },
    update: update = extend({}, enter, {
      opacity: one,
      text: encoder(spec.title)
    }),
    exit: {
      opacity: zero
    }
  };

  titlePos = {
    signal: `lerp(range("${spec.scale}"), ${anchorExpr(0, 1, 0.5)})`
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
    angle:       _('titleAngle'),
    baseline:    _('titleBaseline'),
    fill:        _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font:        _('titleFont'),
    fontSize:    _('titleFontSize'),
    fontStyle:   _('titleFontStyle'),
    fontWeight:  _('titleFontWeight'),
    limit:       _('titleLimit'),
    lineHeight:  _('titleLineHeight')
  }, { // require update
    align:       _('titleAlign')
  });

  !addEncode(encode, 'x', _('titleX'), 'update')
    && !horizontal && !has('x', userEncode)
    && (encode.enter.auto = {value: true});

  !addEncode(encode, 'y', _('titleY'), 'update')
    && horizontal && !has('y', userEncode)
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
