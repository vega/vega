import {GuideTitleStyle} from './constants';
import guideMark from './guide-mark';
import {lookup, alignExpr, anchorExpr} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendTitleRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import {extend} from 'vega-util';

// expression logic for align, anchor, angle, and baseline calculation
const isL = 'item.orient === "left"',
      isR = 'item.orient === "right"',
      isLR = `(${isL} || ${isR})`,
      isVG = `datum.vgrad && ${isLR}`,
      baseline = anchorExpr('"top"', '"bottom"', '"middle"'),
      alignFlip = anchorExpr('"right"', '"left"', '"center"'),
      exprAlign = `datum.vgrad && ${isR} ? (${alignFlip}) : (${isLR} && !(datum.vgrad && ${isL})) ? "left" : ${alignExpr}`,
      exprAnchor = `item._anchor || (${isLR} ? "middle" : "start")`,
      exprAngle = `${isVG} ? (${isL} ? -90 : 90) : 0`,
      exprBaseline = `${isLR} ? (datum.vgrad ? (${isR} ? "bottom" : "top") : ${baseline}) : "top"`;

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      zero = {value: 0},
      encode, enter;

  encode = {
    enter: enter = {
      opacity: zero,
      orient:  encoder(_('titleOrient')),
      _anchor: encoder(_('titleAnchor')),
      anchor:  {signal: exprAnchor},
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      angle: {signal: exprAngle},
      align: {signal: exprAlign},
      baseline: {signal: exprBaseline},
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
    fill:        _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font:        _('titleFont'),
    fontSize:    _('titleFontSize'),
    fontStyle:   _('titleFontStyle'),
    fontWeight:  _('titleFontWeight'),
    limit:       _('titleLimit')
  }, { // require update
    align:       _('titleAlign'),
    baseline:    _('titleBaseline'),
  });

  return guideMark(TextMark, LegendTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
