export {default as parse} from './src/parse';

export {default as selector} from './src/parsers/event-selector';
export {default as signal} from './src/parsers/signal';
export {default as signalUpdates} from './src/parsers/signal-updates';
export {default as stream} from './src/parsers/stream';

export {extendedFunctions as functionContext} from './src/parsers/codegen.js';

export {
  MarkRole,
  FrameRole,
  ScopeRole,
  AxisRole,
  AxisDomainRole,
  AxisGridRole,
  AxisLabelRole,
  AxisTickRole,
  AxisTitleRole,
  LegendRole,
  LegendEntryRole,
  LegendLabelRole,
  LegendSymbolRole,
  LegendTitleRole
} from './src/parsers/marks/roles';
export {marktypes, isMarkType} from './src/parsers/marks/marktypes';

export {default as Scope} from './src/Scope';
export {default as DataScope} from './src/DataScope';
