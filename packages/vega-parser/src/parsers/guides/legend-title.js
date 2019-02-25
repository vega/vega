import {GuideTitleStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendTitleRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import {extend} from 'vega-util';

const angleExpr = 'datum.vgrad ? (item.orient==="left" ? -90 : item.orient==="right" ? 90 : 0) : 0';
const alignExpr = 'datum.vgrad && (item.orient==="left" || item.orient==="right") ? "center" : "left"';
const baselineExpr = '(item.orient==="left" || item.orient==="right") ? (datum.vgrad ? (item.orient==="right" ? "bottom" : "top") : "middle") : "top"';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      zero = {value: 0},
      encode, enter;

  encode = {
    enter: enter = {
      opacity: zero,
      orient: encoder(_('titleOrient')),
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      angle: {signal: angleExpr},
      align: {signal: alignExpr},
      baseline: {signal: baselineExpr},
    },
    update: extend({}, enter, {
      opacity: {value: 1},
      text: encoder(spec.title),
    }),
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
