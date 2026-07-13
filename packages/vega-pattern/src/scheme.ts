import type {Pattern} from './types.js';

// Default pattern scheme for redundant color+pattern encoding.
// Ordered for maximal pairwise visual distinctness. Textures only —
// consumers layering this over a separate color channel need every
// entry to carry a distinguishing texture.
export const patternScheme: Pattern[] = [
  'diagonal-stripe', 'circles', 'crosshatch', 'vertical-stripe',
  'squares', 'horizontal-stripe', 'crosses', 'grid', 'caps', 'waves'
].map(name => ({pattern: {name}}));

// Print-friendly monochrome scheme: solid greyscale values interleaved
// with textures, per classic value-plus-texture practice for grayscale
// figures. Four solids is the ceiling for reliably distinguishable flat
// greys on a white background (pure white is excluded — invisible
// without a mark stroke), so solids never sit adjacent, and each texture
// neighbor is drawn from a different geometry family (dot, lattice,
// line, box, curve, glyph) to keep neighbors maximally distinct.
export const monochromeScheme: (Pattern | string)[] = [
  '#000000', 'circles', '#666666', 'crosshatch', '#cccccc',
  'diagonal-stripe', '#999999', 'squares', 'waves', 'crosses'
].map(e => e.startsWith('#') ? e : {pattern: {name: e}});
