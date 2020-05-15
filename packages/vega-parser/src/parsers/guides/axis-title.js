import {getSign, ifTop, ifX, ifY, mult} from './axis-util';
import {Bottom, GuideTitleStyle, Top, one, zero} from './constants';
import guideMark from './guide-mark';
import {alignExpr, anchorExpr, lookup} from './guide-util';
import {addEncoders, encoder, has} from '../encode/util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';
import {isSignal} from '../../util';
import {extend, isArray} from 'vega-util';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      sign = getSign(orient, -1, 1),
      encode, enter, update, titlePos;

  encode = {
    enter: enter = {
      opacity: zero,
      anchor: encoder(_('titleAnchor', null)),
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

  update.x = ifX(orient, titlePos, null, true);
  update.y = ifY(orient, titlePos, null, true);
  enter.angle = ifX(orient, zero, mult(sign, 90));
  enter.baseline = ifX(orient, ifTop(orient, Bottom, Top), {value: Bottom});

  if (isSignal(orient)) {
    update.angle = enter.angle;
    update.baseline = enter.baseline;
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

  autoLayout(_, orient, encode, userEncode);

  return guideMark({
    type:  TextMark,
    role:  AxisTitleRole,
    style: GuideTitleStyle,
    from:  dataRef,
    encode
  }, userEncode);
}

function autoLayout(_, orient, encode, userEncode) {
  const auto = (value, dim, ifXY) => {
    if (value != null) {
      value = encoder(value);
      encode.update[dim] = isArray(encode.update[dim])
        ? ifXY(orient, value, encode.update[dim][0])
        : encode.update[dim] = value;
      return false;
    } else {
      return !has(dim, userEncode) ? true : false;
    }
  };

  const autoY = auto(_('titleX'), 'x', ifY),
        autoX = auto(_('titleY'), 'y', ifX);

  encode.enter.auto = autoX === autoY
    ? encoder(autoX)
    : ifX(orient, encoder(autoX), encoder(autoY));
}
