import legendGradient from './guides/legend-gradient';
import legendGradientLabels from './guides/legend-gradient-labels';
import legendLabels from './guides/legend-labels';
import legendSymbols from './guides/legend-symbols';
import legendTitle from './guides/legend-title';
import guideGroup from './guides/guide-group';
import parseExpression from './expression';
import parseMark from './mark';
import {LegendRole, LegendEntryRole} from './marks/roles';
import {addEncode, encoder, extendEncode} from './encode/encode-util';
import {GuideLabelStyle, GuideTitleStyle, Skip} from './guides/constants';
import {ref, value} from '../util';
import {Collect, LegendEntries} from '../transforms';
import {error} from 'vega-util';

export default function(spec, scope) {
  var type = spec.type || 'symbol',
      config = scope.config.legend,
      encode = spec.encode || {},
      legendEncode = encode.legend || {},
      name = legendEncode.name || undefined,
      interactive = legendEncode.interactive,
      style = legendEncode.style,
      datum, dataRef, entryRef, group, title,
      entryEncode, params, children;

  // resolve 'canonical' scale name
  var scale = spec.size || spec.shape || spec.fill || spec.stroke
           || spec.strokeDash || spec.opacity;

  if (!scale) {
    error('Missing valid scale for legend.');
  }

  // single-element data source for legend group
  datum = {
    orient: value(spec.orient, config.orient),
    title:  spec.title != null
  };
  dataRef = ref(scope.add(Collect(null, [datum])));

  // encoding properties for legend group
  legendEncode = extendEncode({
    enter: legendEnter(config),
    update: {
      offset:       encoder(value(spec.offset, config.offset)),
      padding:      encoder(value(spec.padding, config.padding)),
      titlePadding: encoder(value(spec.titlePadding, config.titlePadding))
    }
  }, legendEncode, Skip);

  // encoding properties for legend entry sub-group
  entryEncode = {
    update: {
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      entryPadding: encoder(value(spec.entryPadding, config.entryPadding))
    }
  };

  if (type === 'gradient') {
    // data source for gradient labels
    entryRef = ref(scope.add(LegendEntries({
      type:   'gradient',
      scale:  scope.scaleRef(scale),
      count:  scope.objectProperty(spec.tickCount),
      values: scope.objectProperty(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendGradient(spec, scale, config, encode.gradient),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
  }

  else {
    // data source for legend entries
    entryRef = ref(scope.add(LegendEntries(params = {
      scale:  scope.scaleRef(scale),
      count:  scope.objectProperty(spec.tickCount),
      values: scope.objectProperty(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendSymbols(spec, config, encode.symbols, entryRef),
      legendLabels(spec, config, encode.labels, entryRef)
    ];

    params.size = sizeExpression(spec, scope, children);
  }

  // generate legend marks
  children = [
    guideGroup(LegendEntryRole, null, null, dataRef, interactive, entryEncode, children)
  ];

  // include legend title if defined
  if (datum.title) {
    title = legendTitle(spec, config, encode.title, dataRef);
    entryEncode.update.y.offset = {
      field: {group: 'titlePadding'},
      offset: get('fontSize', title.encode, scope, GuideTitleStyle)
    };
    children.push(title);
  }

  // build legend specification
  group = guideGroup(LegendRole, style, name, dataRef, interactive, legendEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse legend specification
  return parseMark(group, scope);
}

function sizeExpression(spec, scope, marks) {
  var fontSize = get('fontSize', marks[1].encode, scope, GuideLabelStyle),
      symbolSize = spec.size
        ? 'scale("' + spec.size + '",datum)'
        : deref(get('size', marks[0].encode, scope)),
      expr = 'max(ceil(sqrt(' + symbolSize + ')),' + deref(fontSize) + ')';

  return parseExpression(expr, scope);
}

function legendEnter(config) {
  var enter = {},
      count = addEncode(enter, 'fill', config.fillColor)
            + addEncode(enter, 'stroke', config.strokeColor)
            + addEncode(enter, 'strokeWidth', config.strokeWidth)
            + addEncode(enter, 'strokeDash', config.strokeDash)
            + addEncode(enter, 'cornerRadius', config.cornerRadius);
  return count ? enter : undefined;
}

function deref(v) {
  return v && v.signal || v;
}

function get(name, encode, scope, style) {
  var v = encode && (
    (encode.update && encode.update[name]) ||
    (encode.enter && encode.enter[name])
  );
  return v && v.signal ? v
    : v ? +v.value
    : ((v = scope.config.style[style]) && +v[name]);
}
