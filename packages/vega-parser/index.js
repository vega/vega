export {default as parse} from './src/parse.js';
export {default as config} from './src/config.js';

export {default as signal} from './src/parsers/signal.js';
export {default as signalUpdates} from './src/parsers/signal-updates.js';
export {default as stream} from './src/parsers/stream.js';

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
} from './src/parsers/marks/roles.js';

export {default as Scope} from './src/Scope.js';
export {default as DataScope} from './src/DataScope.js';
