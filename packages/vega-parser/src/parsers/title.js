import {Top, Bottom, Left, GroupTitleStyle} from './guides/constants';
import guideMark from './guides/guide-mark';
import {alignExpr, lookup} from './guides/guide-util';
import parseMark from './mark';
import {TextMark} from './marks/marktypes';
import {TitleRole} from './marks/roles';
import {addEncoders, encoder} from './encode/encode-util';
import {ref} from '../util';
import {Collect} from '../transforms';
import {extend, isString} from 'vega-util';

export default function(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;

  var config = scope.config.title,
      encode = extend({}, spec.encode),
      dataRef, title;

  // single-element data source for group title
  dataRef = ref(scope.add(Collect(null, [{}])));

  // build title specification
  encode.name = spec.name;
  encode.interactive = spec.interactive;
  title = buildTitle(spec, config, encode, dataRef);
  if (spec.zindex) title.zindex = spec.zindex;

  // parse title specification
  return parseMark(title, scope);
}

function buildTitle(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      zero = {value: 0},
      title = spec.text,
      orient = _('orient'),
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      extent = {group: (horizontal ? 'width' : 'height')},
      encode, enter;

  encode = {
    enter: enter = {
      opacity: zero
    },
    update: {
      opacity: {value: 1},
      text:    encoder(title),
      orient:  encoder(orient),
      anchor:  encoder(_('anchor')),
      align:   {signal: alignExpr},
      extent:  {field: extent}
    },
    exit: {
      opacity: zero
    }
  };

  if (horizontal) {
    enter.angle = zero;
    enter.baseline = {value: orient === Top ? Bottom : Top};
  } else {
    enter.angle = {value: sign * 90};
    enter.baseline = {value: Bottom};
  }

  addEncoders(encode, {
    angle:      _('angle'),
    baseline:   _('baseline'),
    fill:       _('color'),
    font:       _('font'),
    fontSize:   _('fontSize'),
    fontStyle:  _('fontStyle'),
    fontWeight: _('fontWeight'),
    frame:      _('frame'),
    limit:      _('limit'),
    offset:     _('offset') || 0
  }, { // update
    align:      _('align')
  });

  return guideMark(TextMark, TitleRole, spec.style || GroupTitleStyle,
                   null, dataRef, encode, userEncode);
}
