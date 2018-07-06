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
import {getEncoding, getStyle, gradientLength, lookup} from './guides/guide-util';
import parseExpression from './expression';
import parseMark from './mark';
import {isContinuous, isDiscretizing} from './scale';
import {LegendRole, LegendEntryRole} from './marks/roles';
import {addEncode, extendEncode} from './encode/encode-util';
import {ref, deref} from '../util';
import {Collect, LegendEntries} from '../transforms';
import {error} from 'vega-util';

export default function(spec, scope) {
  var config = scope.config.legend,
      encode = spec.encode || {},
      legendEncode = encode.legend || {},
      name = legendEncode.name || undefined,
      interactive = legendEncode.interactive,
      style = legendEncode.style,
      entryEncode, entryLayout, params, children,
      type, datum, dataRef, entryRef, group;

  // resolve 'canonical' scale name
  var scale = LegendScales.reduce(function(a, b) { return a || spec[b]; }, 0);
  if (!scale) error('Missing valid scale for legend.');

  // resolve legend type (symbol, gradient, or discrete gradient)
  type = legendType(spec, scope.scaleType(scale));

  // single-element data source for legend group
  datum = {
    orient: lookup('orient', spec, config),
    title:  spec.title != null,
    type:   type
  };
  dataRef = ref(scope.add(Collect(null, [datum])));

  // encoding properties for legend group
  legendEncode = extendEncode(
    buildLegendEncode(spec, config),legendEncode, Skip
  );

  // encoding properties for legend entry sub-group
  entryEncode = {enter: {x: {value: 0}, y: {value: 0}}};

  // data source for legend values
  entryRef = ref(scope.add(LegendEntries(params = {
    type:   type,
    scale:  scope.scaleRef(scale),
    count:  scope.objectProperty(spec.tickCount),
    values: scope.objectProperty(spec.values),
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
      'max(2,2*floor((' + deref(gradientLength(spec, config)) + ')/100))'
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

function buildLegendEncode(spec, config) {
  var encode = {enter: {}, update: {}};

  addEncode(encode, 'offset',       lookup('offset', spec, config));
  addEncode(encode, 'padding',      lookup('padding', spec, config));
  addEncode(encode, 'titlePadding', lookup('titlePadding', spec, config));
  addEncode(encode, 'fill',         lookup('fillColor', spec, config));
  addEncode(encode, 'stroke',       lookup('strokeColor', spec, config));
  addEncode(encode, 'strokeWidth',  lookup('strokeWidth', spec, config));
  addEncode(encode, 'cornerRadius', lookup('cornerRadius', spec, config));
  addEncode(encode, 'strokeDash',   config.strokeDash);

  return encode;
}

function sizeExpression(spec, scope, marks) {
  var fontSize, size, strokeWidth, expr;

  strokeWidth = getEncoding('strokeWidth', marks[0].encode);

  size = spec.size ? 'scale("' + spec.size + '",datum)'
    : getEncoding('size', marks[0].encode, scope);

  fontSize = getFontSize(marks[1].encode, scope, GuideLabelStyle);

  expr = 'max('
    + 'ceil(sqrt(' + deref(size) + ')+' + deref(strokeWidth) + '),'
    + deref(fontSize)
    + ')';

  return parseExpression(expr, scope);
}

function getFontSize(encode, scope, style) {
  return getEncoding('fontSize', encode) || getStyle('fontSize', scope, style);
}
