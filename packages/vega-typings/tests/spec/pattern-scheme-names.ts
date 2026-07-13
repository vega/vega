import { ColorScheme } from 'vega';

// The built-in pattern schemes registered by the vega package must be
// legal ColorScheme names: downstream consumers (e.g. Vega-Lite) type
// their `scheme` properties as ColorScheme rather than accepting bare
// strings, so omitting these names here makes the schemes unusable there.
// (This file is hand-written; tests/spec/valid is generated and wiped by
// build-tests.sh, so the assertion lives here alongside invalid/.)
export const patterns: ColorScheme = 'patterns';
export const monochrome: ColorScheme = 'monochrome';
