import {error} from 'vega-util';
import {registry} from './registry.js';
import type {PatternRegistryEntry} from './types.js';

const patterns: Record<string, PatternRegistryEntry> = {};

function apply(reg: Record<string, PatternRegistryEntry>) {
  for (const k in reg) pattern(k, reg[k]);
}
apply(registry);

/**
 * Registry accessor similar to vega-scale's scheme() helper.
 * pattern(name) -> returns registered pattern (or null)
 * pattern(name, def) -> registers (or overwrites) pattern definition.
 */
export function pattern(name: string): PatternRegistryEntry | null;
export function pattern(name: string, def: PatternRegistryEntry): void;
export function pattern(name: string, def?: PatternRegistryEntry): PatternRegistryEntry | null | void {
  name = name && name.toLowerCase();
  if (!name) error('Missing pattern name');
  if (arguments.length > 1) {
    if (!def || typeof def !== 'object') error('Invalid pattern definition');
    patterns[name] = { ...def };
    return;
  }
  return patterns[name] || null;
}
