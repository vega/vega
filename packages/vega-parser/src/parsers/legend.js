import {
  GuideLabelStyle, Skip,
  Symbols, Gradient, Discrete, LegendScales
} from './guides/constants';
import legendGradient from './guides/legend-gradient';
import legendGradientDiscrete from './guides/legend-gradient-discrete';
import legendGradientLabels from './guides/legend-gradient-labels';
import {default as legendSymbolGroups, legendSymbolLayout} from './guides/legend-symbol-groups';
import legendTitle from './guides/legend-title';
import guideGroup from './guides/guide-group';
import {getEncoding, getStyle, lookup} from './guides/guide-util';
import parseExpression from './expression';
import parseMark from './mark';
import {LegendRole, LegendEntryRole} from './marks/roles';
import {addEncoders, extendEncode} from './encode/encode-util';
import {ref, deref} from '../util';
import {Collect, LegendEntries} from '../transforms';

import {isContinuous, isDiscretizing} from 'vega-scale';
import {error} from 'vega-util';

export default function(spec, scope) {
  var config = scope.config.legend,
      encode = spec.encode || {},
      legendEncode = encode.legend || {},
      name = legendEncode.name || undefined,
      interactive = legendEncode.interactive,
      style = legendEncode.style,
      _ = lookup(spec, config),
      entryEncode, entryLayout, params, children,
      type, datum, dataRef, entryRef, group;

  // resolve 'canonical' scale name
  var scale = LegendScales.reduce(function(a, b) { return a || spec[b]; }, 0);
  if (!scale) error('Missing valid scale for legend.');

  // resolve legend type (symbol, gradient, or discrete gradient)
  type = legendType(spec, scope.scaleType(scale));

  // single-element data source for legend group
  datum = {
    title:  spec.title != null,
    type:   type,
    vgrad:  type !== 'symbol' &&  _.isVertical()
  };
  dataRef = ref(scope.add(Collect(null, [datum])));

  // encoding properties for legend group
  legendEncode = extendEncode(
    buildLegendEncode(_, config), legendEncode, Skip
  );

  // encoding properties for legend entry sub-group
  entryEncode = {enter: {x: {value: 0}, y: {value: 0}}};

  // data source for legend values
  entryRef = ref(scope.add(LegendEntries(params = {
    type:    type,
    scale:   scope.scaleRef(scale),
    count:   scope.objectProperty(_('tickCount')),
    limit:   scope.property(_('symbolLimit')),
    values:  scope.objectProperty(spec.values),
    minstep: scope.property(spec.tickMinStep),
    formatType: scope.property(spec.formatType),
    formatSpecifier: scope.property(spec.format)
  })));

  // continuous gradient legend
  if (type === Gradient) {
    children = [
      legendGradient(spec, scale, config, encode.gradient),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
    // adjust default tick count based on the gradient length
    params.count = params.count || scope.signalRef(
      `max(2,2*floor((${deref(_.gradientLength())})/100))`
    );
  }

  // discrete gradient legend
  else if (type === Discrete) {
    children = [
      legendGradientDiscrete(spec, scale, config, encode.gradient, entryRef),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
  }

  // symbol legend
  else {
    // determine legend symbol group layout
    entryLayout = legendSymbolLayout(spec, config);
    children = [
      legendSymbolGroups(spec, config, encode, entryRef, deref(entryLayout.columns))
    ];
    // pass symbol size information to legend entry generator
    params.size = sizeExpression(spec, scope, children[0].marks);
  }

  // generate legend marks
  children = [
    guideGroup(LegendEntryRole, null, null, dataRef, interactive,
               entryEncode, children, entryLayout)
  ];

  // include legend title if defined
  if (datum.title) {
    children.push(legendTitle(spec, config, encode.title, dataRef));
  }

  // build legend specification
  group = guideGroup(LegendRole, style, name, dataRef, interactive, legendEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse legend specification
  return parseMark(group, scope);
}

function legendType(spec, scaleType) {
  var type = spec.type || Symbols;

  if (!spec.type && scaleCount(spec) === 1 && (spec.fill || spec.stroke)) {
    type = isContinuous(scaleType) ? Gradient
      : isDiscretizing(scaleType) ? Discrete
      : Symbols;
  }

  return type !== Gradient ? type
    : isDiscretizing(scaleType) ? Discrete
    : Gradient;
}

function scaleCount(spec) {
  return LegendScales.reduce(function(count, type) {
    return count + (spec[type] ? 1 : 0);
  }, 0);
}

function buildLegendEncode(_, config) {
  var encode = {enter: {}, update: {}};

  addEncoders(encode, {
    orient:       _('orient'),
    offset:       _('offset'),
    padding:      _('padding'),
    titlePadding: _('titlePadding'),
    cornerRadius: _('cornerRadius'),
    fill:         _('fillColor'),
    stroke:       _('strokeColor'),
    strokeWidth:  config.strokeWidth,
    strokeDash:   config.strokeDash,
    x:            _('legendX'),
    y:            _('legendY'),
  });

  return encode;
}

function sizeExpression(spec, scope, marks) {
  var size = deref(getChannel('size', spec, marks)),
      strokeWidth = deref(getChannel('strokeWidth', spec, marks)),
      fontSize = deref(getFontSize(marks[1].encode, scope, GuideLabelStyle));

  return parseExpression(
    `max(ceil(sqrt(${size})+${strokeWidth}),${fontSize})`,
    scope
  );
}

function getChannel(name, spec, marks) {
  return spec[name]
    ? `scale("${spec[name]}",datum)`
    : getEncoding(name, marks[0].encode);
}

function getFontSize(encode, scope, style) {
  return getEncoding('fontSize', encode) || getStyle('fontSize', scope, style);
}
