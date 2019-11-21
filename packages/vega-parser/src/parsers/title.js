import {Left, Right, GroupSubtitleStyle, GroupTitleStyle, Skip} from './guides/constants';
import guideGroup from './guides/guide-group';
import guideMark from './guides/guide-mark';
import {alignExpr, lookup} from './guides/guide-util';
import parseMark from './mark';
import {TextMark} from './marks/marktypes';
import {TitleRole, TitleTextRole, TitleSubtitleRole} from './marks/roles';
import {addEncoders, extendEncode} from './encode/encode-util';
import {ref} from '../util';
import {Collect} from '../transforms';
import {extend, isString} from 'vega-util';

const angleExpr = `item.orient==="${Left}"?-90:item.orient==="${Right}"?90:0`;

export default function(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;

  var _ = lookup(spec, scope.config.title),
      encode = spec.encode || {},
      userEncode = encode.group || {},
      name = userEncode.name || undefined,
      interactive = userEncode.interactive,
      style = userEncode.style,
      children = [],
      dataRef, group;

  // single-element data source for group title
  dataRef = ref(scope.add(Collect(null, [{}])));

  // include title text
  children.push(buildTitle(spec, _, titleEncode(spec), dataRef));

  // include subtitle text
  if (spec.subtitle) {
    children.push(buildSubTitle(spec, _, encode.subtitle, dataRef));
  }

  // build title specification
  group = guideGroup(TitleRole, style, name, dataRef, interactive,
                     groupEncode(_, userEncode), children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse title specification
  return parseMark(group, scope);
}

// provide backwards-compatibility for title custom encode;
// the top-level encode block has been *deprecated*.
function titleEncode(spec) {
  const encode = spec.encode;
  return (encode && encode.title) || extend({
    name: spec.name,
    interactive: spec.interactive,
    style: spec.style
  }, encode);
}

function groupEncode(_, userEncode) {
  var encode = {enter: {}, update: {}};

  addEncoders(encode, {
    orient:     _('orient'),
    anchor:     _('anchor'),
    align:      {signal: alignExpr},
    angle:      {signal: angleExpr},
    limit:      _('limit'),
    frame:      _('frame'),
    offset:     _('offset') || 0,
    padding:    _('subtitlePadding')
  });

  return extendEncode(encode, userEncode, Skip);
}

function buildTitle(spec, _, userEncode, dataRef) {
  var zero = {value: 0},
      text = spec.text,
      encode = {
        enter: {opacity: zero},
        update: {opacity: {value: 1}},
        exit: {opacity: zero}
      };

  addEncoders(encode, {
    text:       text,
    align:      {signal: 'item.mark.group.align'},
    angle:      {signal: 'item.mark.group.angle'},
    limit:      {signal: 'item.mark.group.limit'},
    baseline:   'top',
    dx:         _('dx'),
    dy:         _('dy'),
    fill:       _('color'),
    font:       _('font'),
    fontSize:   _('fontSize'),
    fontStyle:  _('fontStyle'),
    fontWeight: _('fontWeight'),
    lineHeight: _('lineHeight')
  }, { // update
    align:      _('align'),
    angle:      _('angle'),
    baseline:   _('baseline')
  });

  return guideMark(TextMark, TitleTextRole, GroupTitleStyle,
                   null, dataRef, encode, userEncode);
}

function buildSubTitle(spec, _, userEncode, dataRef) {
  var zero = {value: 0},
      text = spec.subtitle,
      encode = {
        enter: {opacity: zero},
        update: {opacity: {value: 1}},
        exit: {opacity: zero}
      };

  addEncoders(encode, {
    text:       text,
    align:      {signal: 'item.mark.group.align'},
    angle:      {signal: 'item.mark.group.angle'},
    limit:      {signal: 'item.mark.group.limit'},
    baseline:   'top',
    dx:         _('dx'),
    dy:         _('dy'),
    fill:       _('subtitleColor'),
    font:       _('subtitleFont'),
    fontSize:   _('subtitleFontSize'),
    fontStyle:  _('subtitleFontStyle'),
    fontWeight: _('subtitleFontWeight'),
    lineHeight: _('subtitleLineHeight')
  }, { // update
    align:      _('align'),
    angle:      _('angle'),
    baseline:   _('baseline')
  });

  return guideMark(TextMark, TitleSubtitleRole, GroupSubtitleStyle,
                   null, dataRef, encode, userEncode);
}
