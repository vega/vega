import {Top, Bottom, Left, Right, GroupTitleStyle} from './guides/constants';
import guideMark from './guides/guide-mark';
import {alignExpr, lookup} from './guides/guide-util';
import parseMark from './mark';
import {TextMark} from './marks/marktypes';
import {TitleRole} from './marks/roles';
import {addEncoders} from './encode/encode-util';
import {ref} from '../util';
import {Collect} from '../transforms';
import {extend, isString} from 'vega-util';

const angleExpr = `item.orient==="${Left}"?-90:item.orient==="${Right}"?90:0`,
      baselineExpr = `item.orient==="${Bottom}"?"${Top}":"${Bottom}"`;

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
      encode;

  encode = {
    enter: {opacity: zero},
    update: {opacity: {value: 1}},
    exit: {opacity: zero}
  };

  addEncoders(encode, {
    text:       title,
    orient:     _('orient'),
    anchor:     _('anchor'),
    align:      {signal: alignExpr},
    angle:      {signal: angleExpr},
    baseline:   {signal: baselineExpr},
    dx:         _('dx'),
    dy:         _('dy'),
    fill:       _('color'),
    font:       _('font'),
    fontSize:   _('fontSize'),
    fontStyle:  _('fontStyle'),
    fontWeight: _('fontWeight'),
    frame:      _('frame'),
    limit:      _('limit'),
    offset:     _('offset') || 0
  }, { // update
    align:      _('align'),
    angle:      _('angle'),
    baseline:   _('baseline')
  });

  return guideMark(TextMark, TitleRole, spec.style || GroupTitleStyle,
                   null, dataRef, encode, userEncode);
}
