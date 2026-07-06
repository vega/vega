import type {Pattern} from './types.js';

// Default pattern scheme for redundant color+pattern encoding.
// Ordered for maximal pairwise visual distinctness.
export const patternScheme: Pattern[] = [
  'diagonal-stripe', 'circles', 'crosshatch', 'vertical-stripe',
  'squares', 'horizontal-stripe', 'crosses', 'grid', 'caps', 'waves'
].map(name => ({pattern: {name}}));
