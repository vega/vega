import * as d3 from 'd3-ease';

/**
 * The d3-ease easing functions, exposed to the expression language under their
 * d3 names. Each maps a normalized time in [0, 1] to an eased position in
 * [0, 1], letting animations vary their playback rate over the time domain.
 *
 * The parametric families (`easePoly`, `easeBack`, `easeElastic`) are exposed
 * at their default parameters only; d3's `.exponent()` / `.overshoot()` /
 * `.amplitude()` configuration has no expression-language equivalent.
 */
export const easeFunctions = {
  easeLinear: d3.easeLinear,

  easeQuad: d3.easeQuad,
  easeQuadIn: d3.easeQuadIn,
  easeQuadOut: d3.easeQuadOut,
  easeQuadInOut: d3.easeQuadInOut,

  easeCubic: d3.easeCubic,
  easeCubicIn: d3.easeCubicIn,
  easeCubicOut: d3.easeCubicOut,
  easeCubicInOut: d3.easeCubicInOut,

  easePoly: d3.easePoly,
  easePolyIn: d3.easePolyIn,
  easePolyOut: d3.easePolyOut,
  easePolyInOut: d3.easePolyInOut,

  easeSin: d3.easeSin,
  easeSinIn: d3.easeSinIn,
  easeSinOut: d3.easeSinOut,
  easeSinInOut: d3.easeSinInOut,

  easeExp: d3.easeExp,
  easeExpIn: d3.easeExpIn,
  easeExpOut: d3.easeExpOut,
  easeExpInOut: d3.easeExpInOut,

  easeCircle: d3.easeCircle,
  easeCircleIn: d3.easeCircleIn,
  easeCircleOut: d3.easeCircleOut,
  easeCircleInOut: d3.easeCircleInOut,

  easeBounce: d3.easeBounce,
  easeBounceIn: d3.easeBounceIn,
  easeBounceOut: d3.easeBounceOut,
  easeBounceInOut: d3.easeBounceInOut,

  easeBack: d3.easeBack,
  easeBackIn: d3.easeBackIn,
  easeBackOut: d3.easeBackOut,
  easeBackInOut: d3.easeBackInOut,

  easeElastic: d3.easeElastic,
  easeElasticIn: d3.easeElasticIn,
  easeElasticOut: d3.easeElasticOut,
  easeElasticInOut: d3.easeElasticInOut
};

export const easeFunctionNames = Object.keys(easeFunctions);
