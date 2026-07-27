import tape from 'tape';
import { easeFunctionNames, easeFunctions, functionContext } from '../index.js';

tape('easing functions are registered in the function context', t => {
  t.ok(easeFunctionNames.length > 0);
  easeFunctionNames.forEach(name => {
    t.equal(typeof functionContext[name], 'function', `${name} is registered`);
  });
  t.end();
});

tape('easing functions map the unit interval onto itself', t => {
  // the back and elastic families return -0 at the origin, so compare
  // numerically rather than with strict equality
  easeFunctionNames.forEach(name => {
    const ease = easeFunctions[name];
    t.ok(Math.abs(ease(0)) < 1e-12, `${name}(0) is 0`);
    t.ok(Math.abs(ease(1) - 1) < 1e-12, `${name}(1) is 1`);
  });
  t.end();
});

tape('easeLinear is the identity', t => {
  const {easeLinear} = easeFunctions;
  t.equal(easeLinear(0.25), 0.25);
  t.equal(easeLinear(0.5), 0.5);
  t.equal(easeLinear(0.75), 0.75);
  t.end();
});

tape('easeCubicInOut is symmetric about its midpoint', t => {
  const {easeCubicInOut} = easeFunctions;
  t.equal(easeCubicInOut(0.5), 0.5);
  t.ok(Math.abs(easeCubicInOut(0.25) + easeCubicInOut(0.75) - 1) < 1e-12);
  t.end();
});
