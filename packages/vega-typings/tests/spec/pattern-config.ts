import { Config } from 'vega';

// Pattern fills are valid mark-config values (mark-type blocks and named
// style blocks), matching the runtime: vega-parser's encode defaults wrap
// config fill/stroke values verbatim, so pattern wrappers flow through
// exactly like gradients. This pins the typings to that behavior.
// (Hand-written; tests/spec/valid is generated — see pattern-scheme-names.ts.)
export const config: Config = {
  rect: {
    fill: { pattern: { name: 'diagonal-stripe', foreground: '#4c78a8' } }
  },
  style: {
    patterned: {
      fill: { pattern: { name: 'crosshatch' } },
      stroke: { pattern: { rule: { angle: 45 } } }
    }
  }
};
