import {Top, Bottom, Left, GroupTitleStyle} from './guides/constants';
import guideMark from './guides/guide-mark';
import parseMark from './mark';
import {TextMark} from './marks/marktypes';
import {TitleRole} from './marks/roles';
import {addEncode, encoder} from './encode/encode-util';
import {ref} from '../util';
import {Collect} from '../transforms';
import {extend, isObject, isString} from 'vega-util';

export default function(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;

  var config = scope.config.title,
      encode = extend({}, spec.encode),
      datum, dataRef, title;

  // single-element data source for group title
  datum = {
    orient: spec.orient != null ? spec.orient : config.orient
  };
  dataRef = ref(scope.add(Collect(null, [datum])));

  // build title specification
  encode.name = spec.name;
  encode.interactive = spec.interactive;
  title = buildTitle(spec, config, encode, dataRef);
  if (spec.zindex) title.zindex = spec.zindex;

  // parse title specification
  return parseMark(title, scope);
}

function buildTitle(spec, config, userEncode, dataRef) {
  var title = spec.text,
      orient = spec.orient || config.orient,
      anchor = spec.anchor || config.anchor,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      extent = {group: (horizontal ? 'width' : 'height')},
      encode = {}, enter, update, pos, opp, mult, align;

  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'fill', config.color);
  addEncode(enter, 'font', config.font);
  addEncode(enter, 'fontSize', config.fontSize);
  addEncode(enter, 'fontWeight', config.fontWeight);

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: isObject(title) ? title : {value: title + ''},
    offset: encoder((spec.offset != null ? spec.offset : config.offset) || 0)
  };

  if (anchor === 'start') {
    mult = 0;
    align = 'left';
  } else {
    if (anchor === 'end') {
      mult = 1;
      align = 'right';
    } else {
      mult = 0.5;
      align = 'center';
    }
  }

  pos = {field: extent, mult: mult};

  opp = sign < 0 ? {value: 0}
    : horizontal ? {field: {group: 'height'}}
    : {field: {group: 'width'}};

  if (horizontal) {
    update.x = pos;
    update.y = opp;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.x = opp;
    update.y = pos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }
  update.align = {value: align};
  update.limit = {field: extent};

  addEncode(update, 'angle', config.angle);
  addEncode(update, 'baseline', config.baseline);
  addEncode(update, 'limit', config.limit);

  return guideMark(TextMark, TitleRole, spec.style || GroupTitleStyle, null, dataRef, encode, userEncode);
}
