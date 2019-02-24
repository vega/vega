import {GuideTitleStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendTitleRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      zero = {value: 0},
      encode, enter;

  encode = {
    enter: enter = {
      opacity: zero,
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}}
    },
    update: {
      opacity: {value: 1},
      text: encoder(spec.title),
      x: enter.x,
      y: enter.y
    },
    exit: {
      opacity: zero
    }
  };

  addEncoders(encode, {
    align:       _('titleAlign'),
    baseline:    _('titleBaseline'),
    fill:        _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font:        _('titleFont'),
    fontSize:    _('titleFontSize'),
    fontStyle:   _('titleFontStyle'),
    fontWeight:  _('titleFontWeight'),
    limit:       _('titleLimit')
  });

  return guideMark(TextMark, LegendTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
