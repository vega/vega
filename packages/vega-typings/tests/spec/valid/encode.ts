import { Config, NumericValueRef, ProductionRule, ColorValueRef } from 'vega';
import { mergeConfig } from 'vega';

// --- NumericValueRef: all valid base forms ---

const r1: NumericValueRef = { field: 'x' };
const r2: NumericValueRef = { signal: 'mySignal' };
const r3: NumericValueRef = { value: 5 };
const r4: NumericValueRef = { scale: 'xscale', field: 'x' };
const r5: NumericValueRef = { scale: 'xscale', band: 1 };
const r6: NumericValueRef = { scale: 'xscale', range: 0 };

// The offset-only base case: valid per the schema's required:["offset"] branch
const r7: NumericValueRef = { offset: 5 };
const r8: NumericValueRef = { offset: 5, mult: 2 };

// Modifiers combined with a base value
const r9: NumericValueRef = { field: 'x', mult: 2, offset: 5, round: true };
const r10: NumericValueRef = { scale: 'xscale', signal: 'label.x', band: 0.5 };

// --- ProductionRule: single value form ---

const pr1: ProductionRule<NumericValueRef> = { field: 'x' };
const pr2: ProductionRule<NumericValueRef> = { value: 0 };

// --- ProductionRule: array form with test predicates ---

const pr3: ProductionRule<NumericValueRef> = [
  { test: 'datum.x > 0', scale: 'xscale', field: 'x' },
  { value: 0 },
];

const pr4: ProductionRule<ColorValueRef> = [
  { test: 'datum.selected', value: 'red' },
  { test: 'datum.hovered', scale: 'colorScale', field: 'category' },
  { value: 'gray' },
];

// --- mergeConfig: accepts vega-typings Config without requiring index signature ---

declare const configA: Config;
declare const configB: Config;
declare const partialConfig: Partial<Config>;

const merged1: Config = mergeConfig(configA, configB);
const merged2: Config = mergeConfig(partialConfig, configA);
const merged3: Config = mergeConfig(configA, partialConfig, configB);
