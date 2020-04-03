import {resolveAxisOrientConditional, xyAxisConditionalEncoding} from './axis-util';
import {Bottom, GuideTitleStyle, Left, Top, one, zero} from './constants';
import guideMark from './guide-mark';
import {alignExpr, anchorExpr, lookup} from './guide-util';
import {encoder, has} from '../encode/encode-util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';
import {addEncode, addEncoders} from '../encode/encode-util';
import {extend} from 'vega-util';
import { isSignal } from '../../util';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      sign = resolveAxisOrientConditional([Left, Top], orient, -1, 1),
      horizontal = (orient === Top || orient === Bottom),
      encode, enter, update, titlePos, u, v, titleXY, titleName;

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

  if (isSignal(orient)) {
    update.x = xyAxisConditionalEncoding('x', orient.signal, titlePos, null);
    update.y = xyAxisConditionalEncoding('y', orient.signal, titlePos, null);
    enter.angle = update.angle = 
      xyAxisConditionalEncoding('x',
        orient.signal,
        zero,
        { signal: `(${sign.signal}) * 90` }
      );
    enter.baseline = update.baseline =
      xyAxisConditionalEncoding('x', 
        orient.signal,
        {signal: `(${orient.signal}) === "${Top}" ? "bottom" : "top"`},
        {value: 'bottom'}
      );
  } else {
    if (horizontal) {
      update.x = titlePos;
      enter.angle = zero;
      enter.baseline = {value: orient === Top ? 'bottom' : 'top'};
    } else {
      update.y = titlePos;
      enter.angle = {value: sign * 90};
      enter.baseline = {value: 'bottom'};
    }
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

  if (isSignal(orient)) {
    for (u of ['x', 'y']) {
      v = u === 'x' ? 'y' : 'x';
      titleName = 'title' + u.toUpperCase();

      if (_(titleName) != null) {
        titleXY = encode.update[u];
        delete titleXY[0].signal;

        titleXY[0] = extend({}, encode.update['x'][0], _(titleName));
      } else {
        if (!has(u, userEncode)) {
          if (!encode.enter.auto) {
            encode.enter.auto = [];
          }

          encode.enter.auto.push(
            xyAxisConditionalEncoding(v, orient.signal, { value: true }, null)[0]
          );
        }
      }
    }
  } else {   
    if (!addEncode(encode, 'x', _('titleX'), 'update')) {
      !horizontal && !has('x', userEncode)
      && (encode.enter.auto = {value: true});
    }
  
    if (!addEncode(encode, 'y', _('titleY'), 'update')) {
      horizontal && !has('y', userEncode)
      && (encode.enter.auto = {value: true});
    }
  }

  return guideMark({
    type:  TextMark,
    role:  AxisTitleRole,
    style: GuideTitleStyle,
    from:  dataRef,
    encode
  }, userEncode);
}
