export {pattern} from './patterns.js';
export {normalizePatternSpec, isPattern, patternKey} from './normalizer.js';
export {buildLinesPath} from './lines.js';
export {patternScheme} from './scheme.js';

// Exported for test access only (registry-test.js); not part of the
// public vega-pattern API.
export {registry} from './registry.js';

export type {
  NormalizedPatternSpec,
  Pattern,
  PatternDefinition,
  PatternDefinitionBase,
  PatternImage,
  PatternNamed,
  PatternRegistryEntry,
  PatternRule,
  PatternLinesShape,
  PatternSymbol
} from './types.js';
export type {LinesOptions} from './lines.js';
