import legendLabels from './guides/legend-labels';
import legendSymbols from './guides/legend-symbols';
import legendTitle from './guides/legend-title';
import guideGroup from './guides/guide-group';
import {encoder, extendEncode} from './guides/encode-util';
import parseMark from './mark';
import {ref, entry, transform} from '../util';
import {error} from 'vega-util';

export default function(spec, scope) {
  var config = scope.config,
      encode = spec.encode || {},
      interactive = !!spec.interactive,
      datum, dataRef, entryRef, group, title,
      legendEncode, entryEncode, children;

  // resolve 'canonical' scale name
  var scale = spec.size || spec.shape || spec.fill || spec.stroke || spec.opacity;

  if (!scale) {
    error('Missing valid scale for legend.');
  }

  // single-element data source for axis group
  datum = {
    orient: value(spec.orient, config.legendOrient),
    title:  spec.title
  };
  dataRef = ref(scope.add(entry('Collect', [datum], {})));

  // encoding properties for legend group
  legendEncode = extendEncode({
    update: {
      offset:        encoder(value(spec.offset, config.legendOffset)),
      padding:       encoder(value(spec.padding, config.legendPadding)),
      titlePadding:  encoder(value(spec.titlePadding, config.legendTitlePadding))
    }
  }, encode.legend);

  // encoding properties for legend entry sub-group
  entryEncode = {
    update: {
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      entryPadding: encoder(value(spec.entryPadding, config.legendEntryPadding))
    }
  };

  // data source for legend entries
  entryRef = ref(scope.add(transform('LegendEntries', {
    size:   sizeExpression(spec, config, encode.labels),
    scale:  scope.scaleRef(scale),
    count:  scope.property(spec.count),
    values: scope.property(spec.values),
    formatSpecifier: scope.property(spec.formatSpecifier)
  })));

  // generate legend marks
  children = [
    guideGroup('legend-entries', dataRef, interactive, entryEncode, [
      legendSymbols(spec, config, encode.symbols, entryRef),
      legendLabels(spec, config, encode.labels, entryRef)
    ])
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
  group = guideGroup('legend', dataRef, interactive, legendEncode, children);

  // parse legend specification
  return parseMark(group, scope);
}

function value(value, defaultValue) {
  return value != null ? value : defaultValue;
}

function sizeExpression(spec, config, encode) {
  // TODO get override for symbolSize...
  var symbolSize = +config.legendSymbolSize, fontSize;
  fontSize = encode && encode.update && encode.update.fontSize;
  if (!fontSize) fontSize = encode && encode.enter && encode.enter.fontSize;
  if (fontSize) fontSize = fontSize.value; // TODO support signal?
  if (!fontSize) fontSize = +config.legendLabelFontSize;

  return spec.size
    ? {$expr: 'Math.max(ceil(sqrt(_.scale(datum))),' + fontSize + ')'}
    : Math.max(Math.ceil(Math.sqrt(symbolSize)), fontSize);
}
