import {Left, Right, GroupSubtitleStyle, GroupTitleStyle} from './guides/constants';
import guideGroup from './guides/guide-group';
import guideMark from './guides/guide-mark';
import {alignExpr, lookup} from './guides/guide-util';
import parseMark from './mark';
import {TextMark} from './marks/marktypes';
import {TitleRole, TitleTextRole, TitleSubtitleRole} from './marks/roles';
import {addEncoders} from './encode/encode-util';
import {ref, value} from '../util';
import {Collect} from '../transforms';
import {isString} from 'vega-util';

const angleExpr = `item.orient==="${Left}"?-90:item.orient==="${Right}"?90:0`;

export default function(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;

  var _ = lookup(spec, scope.config.title),
      encode = spec.encode || {},
      name = undefined,
      interactive = undefined,
      style = undefined,
      children = [],
      dataRef, group;

  // single-element data source for group title
  dataRef = ref(scope.add(Collect(null, [{}])));

  // include title text
  children.push(buildTitle(spec, _, encode.title, dataRef));

  // include subtitle text
  if (spec.subtitle) {
    children.push(buildSubTitle(spec, _, encode.subtitle, dataRef));
  }

  // build title specification
  group = guideGroup(TitleRole, style, name, dataRef,
                     interactive, groupEncode(_), children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse title specification
  return parseMark(group, scope);
}

function groupEncode(_) {
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

  return encode;
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
    fontWeight: _('fontWeight')
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
    fill:       value(_('subtitleColor'), _('color')),
    font:       value(_('subtitleFont'), _('font')),
    fontSize:   _('subtitleFontSize'),
    fontStyle:  _('subtitleFontStyle'),
    fontWeight: _('subtitleFontWeight')
  }, { // update
    align:      _('align'),
    angle:      _('angle'),
    baseline:   _('baseline')
  });

  return guideMark(TextMark, TitleSubtitleRole, GroupSubtitleStyle,
                   null, dataRef, encode, userEncode);
}
