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

  yEncode.mult = 0.5;

  // -- LEGEND SYMBOLS --
  encode = {
    enter:  enter = {
      opacity: zero,
      x: {signal: xSignal, mult: 0.5, offset: symbolOffset},
      y: yEncode
    },
    update: update = {
      opacity: {value: 1},
      x: enter.x,
      y: enter.y
    },
    exit: {
      opacity: zero
    }
  };

  if (!spec.fill) {
    addEncode(encode, 'fill',   config.symbolBaseFillColor);
    addEncode(encode, 'stroke', config.symbolBaseStrokeColor);
  }
  addEncode(encode, 'shape',       lookup('symbolType', spec, config));
  addEncode(encode, 'size',        lookup('symbolSize', spec, config));
  addEncode(encode, 'strokeWidth', lookup('symbolStrokeWidth', spec, config));
  addEncode(encode, 'fill',        lookup('symbolFillColor', spec, config));
  addEncode(encode, 'stroke',      lookup('symbolStrokeColor', spec, config));
  addEncode(encode, 'opacity',     lookup('symbolOpacity', spec, config), 'update');

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
  labelOffset = encoder(symbolOffset);
  labelOffset.offset = lookup('labelOffset', spec, config);

  encode = {
    enter:  enter = {
      opacity: zero,
      x: {signal: xSignal, offset: labelOffset},
      y: yEncode
    },
    update: update = {
      opacity: {value: 1},
      text: {field: Label},
      x: enter.x,
      y: enter.y
    },
    exit: {
      opacity: zero
    }
  };

  addEncode(encode, 'align',       lookup('labelAlign', spec, config));
  addEncode(encode, 'baseline',    lookup('labelBaseline', spec, config));
  addEncode(encode, 'fill',        lookup('labelColor', spec, config));
  addEncode(encode, 'font',        lookup('labelFont', spec, config));
  addEncode(encode, 'fontSize',    lookup('labelFontSize', spec, config));
  addEncode(encode, 'fontWeight',  lookup('labelFontWeight', spec, config));
  addEncode(encode, 'limit',       lookup('labelLimit', spec, config));
  addEncode(encode, 'fillOpacity', lookup('labelOpacity', spec, config));

  labels = guideMark(
    TextMark, LegendLabelRole, GuideLabelStyle,
    Value, valueRef, encode, userEncode.labels
  );

  // -- LEGEND ENTRY GROUPS --
  encode = {
    enter: {
      noBound: {value: true}, // ignore width/height in bounds calc
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
