import {
  Top, Bottom, Left, Right, Center,
  Start, End, GroupTitleStyle
} from './guides/constants';
import guideMark from './guides/guide-mark';
import {lookup} from './guides/guide-util';
import parseMark from './mark';
import {TextMark} from './marks/marktypes';
import {TitleRole} from './marks/roles';
import {addEncoders, encoder} from './encode/encode-util';
import {ref} from '../util';
import {Collect} from '../transforms';
import {extend, isString, stringValue} from 'vega-util';

function anchorExpr(s, e, m) {
  return `item.anchor==="${Start}"?${s}:item.anchor==="${End}"?${e}:${m}`;
}

// title text alignment
var alignExpr = anchorExpr(
  stringValue(Left),
  stringValue(Right),
  stringValue(Center)
);

// multiplication factor for anchor positioning
var multExpr = anchorExpr(
  `+(item.orient==="${Right}")`,
  `+(item.orient!=="${Left}")`,
  '0.5'
);

export default function(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;

  var config = scope.config.title,
      encode = extend({}, spec.encode),
      _ = lookup(spec, config),
      datum, dataRef, title;

  // single-element data source for group title
  datum = {
    orient: _('orient')
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
  var _ = lookup(spec, config),
      zero = {value: 0},
      title = spec.text,
      orient = _('orient'),
      anchor = _('anchor'),
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      extent = {group: (horizontal ? 'width' : 'height')},
      encode, enter, update, pos, opp;

  // title positioning along orientation axis
  pos = {field: extent, mult: {signal: multExpr}};

  // title baseline position
  opp = sign < 0 ? zero
    : horizontal ? {field: {group: 'height'}}
    : {field: {group: 'width'}};

  encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: {value: 1},
      text:    encoder(title),
      anchor:  encoder(anchor),
      orient:  encoder(orient),
      extent:  {field: extent},
      align:   {signal: alignExpr}
    },
    exit: {
      opacity: zero
    }
  };

  if (horizontal) {
    update.x = pos;
    update.y = opp;
    enter.angle = zero;
    enter.baseline = {value: orient === Top ? Bottom : Top};
  } else {
    update.x = opp;
    update.y = pos;
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
