import {GuideTitleStyle, one, zero} from './constants.js';
import guideMark from './guide-mark.js';
import {alignExpr, anchorExpr, lookup} from './guide-util.js';
import {addEncoders} from '../encode/util.js';
import {TextMark} from '../marks/marktypes.js';
import {LegendTitleRole} from '../marks/roles.js';

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
  const _ = lookup(spec, config);

  const encode = {
    enter: {opacity: zero},
    update: {
      opacity: one,
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}}
    },
    exit: {opacity: zero}
  };

  addEncoders(encode, {
    orient:      _('titleOrient'),
    _anchor:     _('titleAnchor'),
    anchor:      {signal: exprAnchor},
    angle:       {signal: exprAngle},
    align:       {signal: exprAlign},
    baseline:    {signal: exprBaseline},
    text:        spec.title,
    fill:        _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font:        _('titleFont'),
    fontSize:    _('titleFontSize'),
    fontStyle:   _('titleFontStyle'),
    fontWeight:  _('titleFontWeight'),
    limit:       _('titleLimit'),
    lineHeight:  _('titleLineHeight')
  }, { // require update
    align:       _('titleAlign'),
    baseline:    _('titleBaseline')
  });

  return guideMark({
    type:  TextMark,
    role:  LegendTitleRole,
    style: GuideTitleStyle,
    from:  dataRef,
    encode
  }, userEncode);
}
