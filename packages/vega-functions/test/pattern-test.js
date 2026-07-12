import tape from 'tape';
import { expressionFunction, pattern } from '../index.js';

tape('pattern constructs canonical wrappers', t => {
  t.deepEqual(pattern('dots'), {pattern: {name: 'dots'}});
  t.deepEqual(
    pattern('dots', {foreground: 'red'}),
    {pattern: {name: 'dots', foreground: 'red'}}
  );
  t.deepEqual(
    pattern({rule: {angle: 45}}, {background: 'white'}),
    {pattern: {rule: {angle: 45}, background: 'white'}}
  );
  t.end();
});

tape('pattern merges overrides onto wrapper input without mutation', t => {
  const wrapper = {pattern: {name: 'crosshatch', foreground: 'black'}};
  const out = pattern(wrapper, {foreground: 'red'});
  t.deepEqual(out, {pattern: {name: 'crosshatch', foreground: 'red'}});
  t.notEqual(out.pattern, wrapper.pattern, 'returns a new inner object');
  t.deepEqual(
    wrapper,
    {pattern: {name: 'crosshatch', foreground: 'black'}},
    'input unchanged'
  );
  t.end();
});

tape('pattern handles null input and is registered', t => {
  t.equal(pattern(null), null);
  t.equal(pattern(undefined), null);
  t.deepEqual(pattern('dots', 'red'), {pattern: {name: 'dots'}},
    'non-object overrides are ignored');
  t.equal(expressionFunction('pattern'), pattern, 'lives in the function context');
  t.end();
});
