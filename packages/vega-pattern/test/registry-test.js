import tape from 'tape';
import {pattern} from '../index.js';
import {registry} from '../src/registry.js';

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

tape('all built-in patterns resolve with tileSize and geometry', t => {
  const names = Object.keys(registry);
  t.equal(names.length, 13, 'registry defines 13 built-in patterns');
  for (const name of names) {
    const p = pattern(name);
    t.ok(p, `${name} resolves via pattern()`);
    t.equal(typeof p.tileSize, 'number', `${name} has a numeric tileSize`);
    t.ok(p.shape || p.rule, `${name} has shape or rule geometry`);
  }
  t.end();
});

tape('pattern(name, def) registers a custom pattern', t => {
  pattern('my-dots', {shape: 'M2,2 h2 v2 h-2 Z', tileSize: 8, fill: '#000'});
  t.equal(pattern('my-dots').tileSize, 8, 'custom pattern registered');
  t.end();
});
