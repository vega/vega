import {
  Index, Label, Offset, Size, Value,
  Skip, GuideLabelStyle, LegendScales
} from './constants';
import guideGroup from './guide-group';
import guideMark from './guide-mark';
import {entryColumns, isVertical, lookup} from './guide-util';
import {SymbolMark, TextMark} from '../marks/marktypes';
import {ScopeRole, LegendSymbolRole, LegendLabelRole} from '../marks/roles';
import {addEncode, encoder, extendEncode} from '../encode/encode-util';

var zero = {value: 0};

// userEncode is top-level, includes entries, symbols, labels
export default function(spec, config, userEncode, dataRef, columns) {
  var entries = userEncode.entries,
      interactive = !!(entries && entries.interactive),
      name = entries ? entries.name : undefined,
      height = lookup('clipHeight', spec, config),
      symbolOffset = lookup('symbolOffset', spec, config),
      valueRef = {data: 'value'},
      encode = {},
      xSignal = columns + '?' + 'datum.' + Offset + ':' + 'datum.' + Size,
      yEncode = height ? encoder(height) : {field: Size},
      index = 'datum.' + Index,
      ncols = 'max(1,' + columns + ')',
      enter, update, labelOffset, symbols, labels, nrows, sort;

  // -- LEGEND SYMBOLS --
  encode = {
    enter:  enter = {opacity: zero},
    exit:   {opacity: zero},
    update: update = {opacity: {value: 1}}
  };

  if (!spec.fill) {
    addEncode(enter, 'fill',   config.symbolBaseFillColor);
    addEncode(enter, 'stroke', config.symbolBaseStrokeColor);
  }
  addEncode(enter, 'shape',       lookup('symbolType', spec, config));
  addEncode(enter, 'size',        lookup('symbolSize', spec, config));
  addEncode(enter, 'strokeWidth', lookup('symbolStrokeWidth', spec, config));
  addEncode(enter, 'fill',        lookup('symbolFillColor', spec, config));
  addEncode(enter, 'stroke',      lookup('symbolStrokeColor', spec, config));

  enter.x = update.x = {
    signal: xSignal,
    mult:   0.5,
    offset: symbolOffset
  };

  yEncode.mult = 0.5;
  enter.y = update.y = yEncode;

  LegendScales.forEach(function(scale) {
    if (spec[scale]) {
      update[scale] = enter[scale] = {scale: spec[scale], field: Value};
    }
  });

  symbols = guideMark(
    SymbolMark, LegendSymbolRole, null,
    Value, valueRef, encode, userEncode.symbols
  );
  if (height) symbols.clip = true;

  // -- LEGEND LABELS --
  encode = {
    enter:  enter = {opacity: zero},
    exit:   {opacity: zero},
    update: update = {
      opacity: {value: 1},
      text: {field: Label}
    }
  };

  addEncode(enter, 'align',      lookup('labelAlign', spec, config));
  addEncode(enter, 'baseline',   lookup('labelBaseline', spec, config));
  addEncode(enter, 'fill',       lookup('labelColor', spec, config));
  addEncode(enter, 'font',       lookup('labelFont', spec, config));
  addEncode(enter, 'fontSize',   lookup('labelFontSize', spec, config));
  addEncode(enter, 'fontWeight', lookup('labelFontWeight', spec, config));
  addEncode(enter, 'limit',      lookup('labelLimit', spec, config));

  labelOffset = encoder(symbolOffset);
  labelOffset.offset = lookup('labelOffset', spec, config);

  enter.x = update.x = {
    signal: xSignal,
    offset: labelOffset
  };

  enter.y = update.y = yEncode;

  labels = guideMark(
    TextMark, LegendLabelRole, GuideLabelStyle,
    Value, valueRef, encode, userEncode.labels
  );

  // -- LEGEND ENTRY GROUPS --
  encode = {
    enter: {
      width: zero,
      height: height ? encoder(height) : zero,
      opacity: zero
    },
    exit: {opacity: zero},
    update: update = {
      opacity: {value: 1},
      row: {signal: null},
      column: {signal: null}
    }
  };

  // annotate and sort groups to ensure correct ordering
  if (isVertical(spec, config.symbolDirection)) {
    nrows = 'ceil(item.mark.items.length/' + ncols + ')';
    update.row.signal = index + '%' + nrows;
    update.column.signal = 'floor(' + index + '/' + nrows + ')';
    sort = {field: ['row', index]};
  } else {
    update.row.signal = 'floor(' + index + '/' + ncols + ')';
    update.column.signal = index + '%' + ncols;
    sort = {field: index};
  }
  // handle zero column case (implies infinite columns)
  update.column.signal = columns + '?' + update.column.signal + ':' + index;

  // facet legend entries into sub-groups
  dataRef = {facet: {data: dataRef, name: 'value', groupby: Index}};

  spec = guideGroup(
    ScopeRole, null, name, dataRef, interactive,
    extendEncode(encode, entries, Skip), [symbols, labels]
  );
  spec.sort = sort;
  return spec;
}

export function legendSymbolLayout(spec, config) {
  // layout parameters for legend entries
  return {
    align:   lookup('gridAlign', spec, config),
    center:  {row: true, column: false},
    columns: entryColumns(spec, config),
    padding: {
      row:    lookup('rowPadding', spec, config),
      column: lookup('columnPadding', spec, config)
    }
  };
}
