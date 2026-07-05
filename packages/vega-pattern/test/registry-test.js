import tape from 'tape';
import {pattern} from '../index.js';

tape('pattern() retrieves built-in patterns', t => {
  const p = pattern('crosshatch');
  t.ok(p, 'crosshatch exists');
  t.ok(p.shape || p.rule, 'built-in has tile-space geometry');
  t.end();
});

tape('pattern() is case-insensitive and returns null for unknown', t => {
  t.ok(pattern('CROSSHATCH'), 'uppercase resolves');
  t.equal(pattern('nope-not-real'), null, 'unknown returns null');
  t.end();
});

tape('pattern(name, def) registers a custom pattern', t => {
  pattern('my-dots', {shape: 'M2,2 h2 v2 h-2 Z', tileSize: 8, fill: '#000'});
  t.equal(pattern('my-dots').tileSize, 8, 'custom pattern registered');
  t.end();
});
