import legendGradient from './guides/legend-gradient';
import legendGradientLabels from './guides/legend-gradient-labels';
import legendLabels from './guides/legend-labels';
import legendSymbols from './guides/legend-symbols';
import legendTitle from './guides/legend-title';
import guideGroup from './guides/guide-group';
import parseMark from './mark';
import {LegendRole, LegendEntryRole} from './marks/roles';
import {addEncode, encoder, extendEncode} from './encode/encode-util';
import {ref} from '../util';
import {Collect, LegendEntries} from '../transforms';
import {error} from 'vega-util';

export default function(spec, scope) {
  var type = spec.type || 'symbol',
      config = scope.config.legend,
      name = spec.name || undefined,
      encode = spec.encode || {},
      interactive = !!spec.interactive,
      datum, dataRef, entryRef, group, title,
      legendEncode, entryEncode, children;

  // resolve 'canonical' scale name
  var scale = spec.size || spec.shape || spec.fill || spec.stroke
           || spec.strokeDash || spec.opacity;

  if (!scale) {
    error('Missing valid scale for legend.');
  }

  // single-element data source for axis group
  datum = {
    orient: value(spec.orient, config.orient),
    title:  spec.title != null
  };
  dataRef = ref(scope.add(Collect(null, [datum])));

  // encoding properties for legend group

  legendEncode = extendEncode({
    enter: legendEnter(config),
    update: {
      offset:        encoder(value(spec.offset, config.offset)),
      padding:       encoder(value(spec.padding, config.padding)),
      titlePadding:  encoder(value(spec.titlePadding, config.titlePadding))
    }
  }, encode.legend);

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
      count:  scope.property(spec.tickCount),
      values: scope.property(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendGradient(scale, config, encode.gradient),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
  }

  else {
    // data source for legend entries
    entryRef = ref(scope.add(LegendEntries({
      size:   sizeExpression(spec, config, encode.labels),
      scale:  scope.scaleRef(scale),
      count:  scope.property(spec.tickCount),
      values: scope.property(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendSymbols(spec, config, encode.symbols, entryRef),
      legendLabels(spec, config, encode.labels, entryRef)
    ];
  }

  // generate legend marks
  children = [
    guideGroup(LegendEntryRole, null, dataRef, interactive, entryEncode, children)
  ];

  // include legend title if defined
  if (datum.title) {
    title = legendTitle(spec, config, encode.title, dataRef);
    entryEncode.update.y.offset = {
      field: {group: 'titlePadding'},
      offset: title.encode.update.fontSize || title.encode.enter.fontSize
    };
    children.push(title);
  }

  // build legend specification
  group = guideGroup(LegendRole, name, dataRef, interactive, legendEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse legend specification
  return parseMark(group, scope);
}

function value(value, defaultValue) {
  return value != null ? value : defaultValue;
}

function sizeExpression(spec, config, encode) {
  // TODO get override for symbolSize?
  var symbolSize = +config.symbolSize, fontSize;
  fontSize = encode && encode.update && encode.update.fontSize;
  if (!fontSize) fontSize = encode && encode.enter && encode.enter.fontSize;
  if (fontSize) fontSize = fontSize.value; // TODO support signal?
  if (!fontSize) fontSize = +config.labelFontSize;

  return spec.size
    ? {$expr: 'Math.max(Math.ceil(Math.sqrt(_.scale(datum))),' + fontSize + ')'}
    : Math.max(Math.ceil(Math.sqrt(symbolSize)), fontSize);
}

function legendEnter(config) {
  var enter = {},
      count = addEncode(enter, 'fill', config.fillColor)
            + addEncode(enter, 'stroke', config.strokeColor)
            + addEncode(enter, 'strokeWidth', config.strokeWidth)
            + addEncode(enter, 'strokeDash', config.strokeDash)
            + addEncode(enter, 'cornerRadius', config.cornerRadius)
  return count ? enter : undefined;
}
