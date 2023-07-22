import { toNumber, peek, toSet, array, constant, isNumber, span, isObject, isString, error, isArray } from 'vega-util';
import { bisectRight, range, bisect } from 'd3-array';
import * as $ from 'd3-scale';
import { scaleOrdinal, tickFormat as tickFormat$1 } from 'd3-scale';
export { scaleImplicit } from 'd3-scale';
import * as $$1 from 'd3-interpolate';
import { timeInterval, utcInterval } from 'vega-time';

function bandSpace (count, paddingInner, paddingOuter) {
  const space = count - paddingInner + paddingOuter * 2;
  return count ? space > 0 ? space : 1 : 0;
}

const Identity = 'identity';
const Linear = 'linear';
const Log = 'log';
const Pow = 'pow';
const Sqrt = 'sqrt';
const Symlog = 'symlog';
const Time = 'time';
const UTC = 'utc';
const Sequential = 'sequential';
const Diverging = 'diverging';
const Quantile = 'quantile';
const Quantize = 'quantize';
const Threshold = 'threshold';
const Ordinal = 'ordinal';
const Point = 'point';
const Band = 'band';
const BinOrdinal = 'bin-ordinal';

// categories
const Continuous = 'continuous';
const Discrete = 'discrete';
const Discretizing = 'discretizing';
const Interpolating = 'interpolating';
const Temporal = 'temporal';

function invertRange (scale) {
  return function (_) {
    let lo = _[0],
      hi = _[1],
      t;
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    return [scale.invert(lo), scale.invert(hi)];
  };
}

function invertRangeExtent (scale) {
  return function (_) {
    const range = scale.range();
    let lo = _[0],
      hi = _[1],
      min = -1,
      max,
      t,
      i,
      n;
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    for (i = 0, n = range.length; i < n; ++i) {
      if (range[i] >= lo && range[i] <= hi) {
        if (min < 0) min = i;
        max = i;
      }
    }
    if (min < 0) return undefined;
    lo = scale.invertExtent(range[min]);
    hi = scale.invertExtent(range[max]);
    return [lo[0] === undefined ? lo[1] : lo[0], hi[1] === undefined ? hi[0] : hi[1]];
  };
}

function band() {
  const scale = scaleOrdinal().unknown(undefined),
    domain = scale.domain,
    ordinalRange = scale.range;
  let range$1 = [0, 1],
    step,
    bandwidth,
    round = false,
    paddingInner = 0,
    paddingOuter = 0,
    align = 0.5;
  delete scale.unknown;
  function rescale() {
    const n = domain().length,
      reverse = range$1[1] < range$1[0],
      stop = range$1[1 - reverse],
      space = bandSpace(n, paddingInner, paddingOuter);
    let start = range$1[reverse - 0];
    step = (stop - start) / (space || 1);
    if (round) {
      step = Math.floor(step);
    }
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) {
      start = Math.round(start);
      bandwidth = Math.round(bandwidth);
    }
    const values = range(n).map(i => start + step * i);
    return ordinalRange(reverse ? values.reverse() : values);
  }
  scale.domain = function (_) {
    if (arguments.length) {
      domain(_);
      return rescale();
    } else {
      return domain();
    }
  };
  scale.range = function (_) {
    if (arguments.length) {
      range$1 = [+_[0], +_[1]];
      return rescale();
    } else {
      return range$1.slice();
    }
  };
  scale.rangeRound = function (_) {
    range$1 = [+_[0], +_[1]];
    round = true;
    return rescale();
  };
  scale.bandwidth = function () {
    return bandwidth;
  };
  scale.step = function () {
    return step;
  };
  scale.round = function (_) {
    if (arguments.length) {
      round = !!_;
      return rescale();
    } else {
      return round;
    }
  };
  scale.padding = function (_) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _));
      paddingInner = paddingOuter;
      return rescale();
    } else {
      return paddingInner;
    }
  };
  scale.paddingInner = function (_) {
    if (arguments.length) {
      paddingInner = Math.max(0, Math.min(1, _));
      return rescale();
    } else {
      return paddingInner;
    }
  };
  scale.paddingOuter = function (_) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _));
      return rescale();
    } else {
      return paddingOuter;
    }
  };
  scale.align = function (_) {
    if (arguments.length) {
      align = Math.max(0, Math.min(1, _));
      return rescale();
    } else {
      return align;
    }
  };
  scale.invertRange = function (_) {
    // bail if range has null or undefined values
    if (_[0] == null || _[1] == null) return;
    const reverse = range$1[1] < range$1[0],
      values = reverse ? ordinalRange().reverse() : ordinalRange(),
      n = values.length - 1;
    let lo = +_[0],
      hi = +_[1],
      a,
      b,
      t;

    // bail if either range endpoint is invalid
    if (lo !== lo || hi !== hi) return;

    // order range inputs, bail if outside of scale range
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    if (hi < values[0] || lo > range$1[1 - reverse]) return;

    // binary search to index into scale range
    a = Math.max(0, bisectRight(values, lo) - 1);
    b = lo === hi ? a : bisectRight(values, hi) - 1;

    // increment index a if lo is within padding gap
    if (lo - values[a] > bandwidth + 1e-10) ++a;
    if (reverse) {
      // map + swap
      t = a;
      a = n - b;
      b = n - t;
    }
    return a > b ? undefined : domain().slice(a, b + 1);
  };
  scale.invert = function (_) {
    const value = scale.invertRange([_, _]);
    return value ? value[0] : value;
  };
  scale.copy = function () {
    return band().domain(domain()).range(range$1).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };
  return rescale();
}
function pointish(scale) {
  const copy = scale.copy;
  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  scale.copy = function () {
    return pointish(copy());
  };
  return scale;
}
function point() {
  return pointish(band().paddingInner(1));
}

var map = Array.prototype.map;
function numbers(_) {
  return map.call(_, toNumber);
}

const slice = Array.prototype.slice;

function scaleBinOrdinal() {
  let domain = [],
    range = [];
  function scale(x) {
    return x == null || x !== x ? undefined : range[(bisect(domain, x) - 1) % range.length];
  }
  scale.domain = function (_) {
    if (arguments.length) {
      domain = numbers(_);
      return scale;
    } else {
      return domain.slice();
    }
  };
  scale.range = function (_) {
    if (arguments.length) {
      range = slice.call(_);
      return scale;
    } else {
      return range.slice();
    }
  };
  scale.tickFormat = function (count, specifier) {
    return tickFormat$1(domain[0], peek(domain), count == null ? 10 : count, specifier);
  };
  scale.copy = function () {
    return scaleBinOrdinal().domain(scale.domain()).range(scale.range());
  };
  return scale;
}

/** Private scale registry: should not be exported */
const scales = new Map();
const VEGA_SCALE = Symbol('vega_scale');
function registerScale(scale) {
  scale[VEGA_SCALE] = true;
  return scale;
}

/**
 * Return true if object was created by a constructor from the vega-scale `scale` function.
 */
function isRegisteredScale(scale) {
  return scale && scale[VEGA_SCALE] === true;
}

/**
 * Augment scales with their type and needed inverse methods.
 */
function create(type, constructor, metadata) {
  const ctr = function scale() {
    const s = constructor();
    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s) : s.invertExtent ? invertRangeExtent(s) : undefined;
    }
    s.type = type;
    return registerScale(s);
  };
  ctr.metadata = toSet(array(metadata));
  return ctr;
}

/**
 * Registry function for adding and accessing scale constructor functions.
 * The *type* argument is a String indicating the name of the scale type.
 *
 * If the *scale* argument is not specified, this method returns the matching scale constructor in the registry, or `null` if not found.
 * If the *scale* argument is provided, it must be a scale constructor function to add to the registry under the given *type* name.
 * The *metadata* argument provides additional information to guide appropriate use of scales within Vega.
 *
 *  *metadata* can be either a string or string array. The valid string values are:
 * - `"continuous"` - the scale is defined over a continuous-valued domain.
 * - `"discrete"` - the scale is defined over a discrete domain and range.
 * - `"discretizing"` - the scale discretizes a continuous domain to a discrete range.
 * - `"interpolating"` - the scale range is defined using a color interpolator.
 * - `"log"` - the scale performs a logarithmic transform of the continuous domain.
 * - `"temporal"` - the scale domain is defined over date-time values.
 */
function scale(type, scale, metadata) {
  if (arguments.length > 1) {
    scales.set(type, create(type, scale, metadata));
    return this;
  } else {
    return isValidScaleType(type) ? scales.get(type) : undefined;
  }
}

// identity scale
scale(Identity, $.scaleIdentity);

// continuous scales
scale(Linear, $.scaleLinear, Continuous);
scale(Log, $.scaleLog, [Continuous, Log]);
scale(Pow, $.scalePow, Continuous);
scale(Sqrt, $.scaleSqrt, Continuous);
scale(Symlog, $.scaleSymlog, Continuous);
scale(Time, $.scaleTime, [Continuous, Temporal]);
scale(UTC, $.scaleUtc, [Continuous, Temporal]);

// sequential scales
scale(Sequential, $.scaleSequential, [Continuous, Interpolating]); // backwards compat
scale(`${Sequential}-${Linear}`, $.scaleSequential, [Continuous, Interpolating]);
scale(`${Sequential}-${Log}`, $.scaleSequentialLog, [Continuous, Interpolating, Log]);
scale(`${Sequential}-${Pow}`, $.scaleSequentialPow, [Continuous, Interpolating]);
scale(`${Sequential}-${Sqrt}`, $.scaleSequentialSqrt, [Continuous, Interpolating]);
scale(`${Sequential}-${Symlog}`, $.scaleSequentialSymlog, [Continuous, Interpolating]);

// diverging scales
scale(`${Diverging}-${Linear}`, $.scaleDiverging, [Continuous, Interpolating]);
scale(`${Diverging}-${Log}`, $.scaleDivergingLog, [Continuous, Interpolating, Log]);
scale(`${Diverging}-${Pow}`, $.scaleDivergingPow, [Continuous, Interpolating]);
scale(`${Diverging}-${Sqrt}`, $.scaleDivergingSqrt, [Continuous, Interpolating]);
scale(`${Diverging}-${Symlog}`, $.scaleDivergingSymlog, [Continuous, Interpolating]);

// discretizing scales
scale(Quantile, $.scaleQuantile, [Discretizing, Quantile]);
scale(Quantize, $.scaleQuantize, Discretizing);
scale(Threshold, $.scaleThreshold, Discretizing);

// discrete scales
scale(BinOrdinal, scaleBinOrdinal, [Discrete, Discretizing]);
scale(Ordinal, $.scaleOrdinal, Discrete);
scale(Band, band, Discrete);
scale(Point, point, Discrete);
function isValidScaleType(type) {
  return scales.has(type);
}
function hasType(key, type) {
  const s = scales.get(key);
  return s && s.metadata[type];
}
function isContinuous(key) {
  return hasType(key, Continuous);
}
function isDiscrete(key) {
  return hasType(key, Discrete);
}
function isDiscretizing(key) {
  return hasType(key, Discretizing);
}
function isLogarithmic(key) {
  return hasType(key, Log);
}
function isTemporal(key) {
  return hasType(key, Temporal);
}
function isInterpolating(key) {
  return hasType(key, Interpolating);
}
function isQuantile(key) {
  return hasType(key, Quantile);
}

const scaleProps = ['clamp', 'base', 'constant', 'exponent'];
function interpolateRange(interpolator, range) {
  const start = range[0],
    span = peek(range) - start;
  return function (i) {
    return interpolator(start + i * span);
  };
}
function interpolateColors(colors, type, gamma) {
  return $$1.piecewise(interpolate(type || 'rgb', gamma), colors);
}
function quantizeInterpolator(interpolator, count) {
  const samples = new Array(count),
    n = count + 1;
  for (let i = 0; i < count;) samples[i] = interpolator(++i / n);
  return samples;
}
function scaleCopy(scale) {
  const t = scale.type,
    s = scale.copy();
  s.type = t;
  return s;
}
function scaleFraction(scale$1, min, max) {
  const delta = max - min;
  let i, t, s;
  if (!delta || !Number.isFinite(delta)) {
    return constant(0.5);
  } else {
    i = (t = scale$1.type).indexOf('-');
    t = i < 0 ? t : t.slice(i + 1);
    s = scale(t)().domain([min, max]).range([0, 1]);
    scaleProps.forEach(m => scale$1[m] ? s[m](scale$1[m]()) : 0);
    return s;
  }
}
function interpolate(type, gamma) {
  const interp = $$1[method(type)];
  return gamma != null && interp && interp.gamma ? interp.gamma(gamma) : interp;
}
function method(type) {
  return 'interpolate' + type.toLowerCase().split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
}

const continuous = {
  blues: 'cfe1f2bed8eca8cee58fc1de74b2d75ba3cf4592c63181bd206fb2125ca40a4a90',
  greens: 'd3eecdc0e6baabdda594d3917bc77d60ba6c46ab5e329a512089430e7735036429',
  greys: 'e2e2e2d4d4d4c4c4c4b1b1b19d9d9d8888887575756262624d4d4d3535351e1e1e',
  oranges: 'fdd8b3fdc998fdb87bfda55efc9244f87f2cf06b18e4580bd14904b93d029f3303',
  purples: 'e2e1efd4d4e8c4c5e0b4b3d6a3a0cc928ec3827cb97566ae684ea25c3696501f8c',
  reds: 'fdc9b4fcb49afc9e80fc8767fa7051f6573fec3f2fdc2a25c81b1db21218970b13',
  blueGreen: 'd5efedc1e8e0a7ddd18bd2be70c6a958ba9144ad77319c5d2089460e7736036429',
  bluePurple: 'ccddecbad0e4a8c2dd9ab0d4919cc98d85be8b6db28a55a6873c99822287730f71',
  greenBlue: 'd3eecec5e8c3b1e1bb9bd8bb82cec269c2ca51b2cd3c9fc7288abd1675b10b60a1',
  orangeRed: 'fddcaffdcf9bfdc18afdad77fb9562f67d53ee6545e24932d32d1ebf130da70403',
  purpleBlue: 'dbdaebc8cee4b1c3de97b7d87bacd15b9fc93a90c01e7fb70b70ab056199045281',
  purpleBlueGreen: 'dbd8eac8cee4b0c3de93b7d872acd1549fc83892bb1c88a3097f8702736b016353',
  purpleRed: 'dcc9e2d3b3d7ce9eccd186c0da6bb2e14da0e23189d91e6fc61159ab07498f023a',
  redPurple: 'fccfccfcbec0faa9b8f98faff571a5ec539ddb3695c41b8aa908808d0179700174',
  yellowGreen: 'e4f4acd1eca0b9e2949ed68880c97c62bb6e47aa5e3297502083440e723b036034',
  yellowOrangeBrown: 'feeaa1fedd84fecc63feb746fca031f68921eb7215db5e0bc54c05ab3d038f3204',
  yellowOrangeRed: 'fee087fed16ffebd59fea849fd903efc7335f9522bee3423de1b20ca0b22af0225',
  blueOrange: '134b852f78b35da2cb9dcae1d2e5eff2f0ebfce0bafbbf74e8932fc5690d994a07',
  brownBlueGreen: '704108a0651ac79548e3c78af3e6c6eef1eac9e9e48ed1c74da79e187a72025147',
  purpleGreen: '5b1667834792a67fb6c9aed3e6d6e8eff0efd9efd5aedda971bb75368e490e5e29',
  purpleOrange: '4114696647968f83b7b9b4d6dadbebf3eeeafce0bafbbf74e8932fc5690d994a07',
  redBlue: '8c0d25bf363adf745ef4ae91fbdbc9f2efeed2e5ef9dcae15da2cb2f78b3134b85',
  redGrey: '8c0d25bf363adf745ef4ae91fcdccbfaf4f1e2e2e2c0c0c0969696646464343434',
  yellowGreenBlue: 'eff9bddbf1b4bde5b594d5b969c5be45b4c22c9ec02182b82163aa23479c1c3185',
  redYellowBlue: 'a50026d4322cf16e43fcac64fedd90faf8c1dcf1ecabd6e875abd04a74b4313695',
  redYellowGreen: 'a50026d4322cf16e43fcac63fedd8df9f7aed7ee8ea4d86e64bc6122964f006837',
  pinkYellowGreen: '8e0152c0267edd72adf0b3d6faddedf5f3efe1f2cab6de8780bb474f9125276419',
  spectral: '9e0142d13c4bf0704afcac63fedd8dfbf8b0e0f3a1a9dda269bda94288b55e4fa2',
  viridis: '440154470e61481a6c482575472f7d443a834144873d4e8a39568c35608d31688e2d708e2a788e27818e23888e21918d1f988b1fa08822a8842ab07f35b77943bf7154c56866cc5d7ad1518fd744a5db36bcdf27d2e21be9e51afde725',
  magma: '0000040404130b0924150e3720114b2c11603b0f704a107957157e651a80721f817f24828c29819a2e80a8327db6377ac43c75d1426fde4968e95462f1605df76f5cfa7f5efc8f65fe9f6dfeaf78febf84fece91fddea0fcedaffcfdbf',
  inferno: '0000040403130c0826170c3b240c4f330a5f420a68500d6c5d126e6b176e781c6d86216b932667a12b62ae305cbb3755c73e4cd24644dd513ae65c30ed6925f3771af8850ffb9506fca50afcb519fac62df6d645f2e661f3f484fcffa4',
  plasma: '0d088723069033059742039d5002a25d01a66a00a87801a88405a7900da49c179ea72198b12a90ba3488c33d80cb4779d35171da5a69e16462e76e5bed7953f2834cf68f44fa9a3dfca636fdb32ffec029fcce25f9dc24f5ea27f0f921',
  cividis: '00205100235800265d002961012b65042e670831690d346b11366c16396d1c3c6e213f6e26426e2c456e31476e374a6e3c4d6e42506e47536d4c566d51586e555b6e5a5e6e5e616e62646f66676f6a6a706e6d717270717573727976737c79747f7c75827f758682768985778c8877908b78938e789691789a94789e9778a19b78a59e77a9a177aea575b2a874b6ab73bbaf71c0b26fc5b66dc9b96acebd68d3c065d8c462ddc85fe2cb5ce7cf58ebd355f0d652f3da4ff7de4cfae249fce647',
  rainbow: '6e40aa883eb1a43db3bf3cafd83fa4ee4395fe4b83ff576eff6659ff7847ff8c38f3a130e2b72fcfcc36bee044aff05b8ff4576ff65b52f6673af27828ea8d1ddfa319d0b81cbecb23abd82f96e03d82e14c6edb5a5dd0664dbf6e40aa',
  sinebow: 'ff4040fc582af47218e78d0bd5a703bfbf00a7d5038de70b72f41858fc2a40ff402afc5818f4720be78d03d5a700bfbf03a7d50b8de71872f42a58fc4040ff582afc7218f48d0be7a703d5bf00bfd503a7e70b8df41872fc2a58ff4040',
  turbo: '23171b32204a3e2a71453493493eae4b49c54a53d7485ee44569ee4074f53c7ff8378af93295f72e9ff42ba9ef28b3e926bce125c5d925cdcf27d5c629dcbc2de3b232e9a738ee9d3ff39347f68950f9805afc7765fd6e70fe667cfd5e88fc5795fb51a1f84badf545b9f140c5ec3cd0e637dae034e4d931ecd12ef4c92bfac029ffb626ffad24ffa223ff9821ff8d1fff821dff771cfd6c1af76118f05616e84b14df4111d5380fcb2f0dc0260ab61f07ac1805a313029b0f00950c00910b00',
  browns: 'eedbbdecca96e9b97ae4a865dc9856d18954c7784cc0673fb85536ad44339f3632',
  tealBlues: 'bce4d89dd3d181c3cb65b3c245a2b9368fae347da0306a932c5985',
  teals: 'bbdfdfa2d4d58ac9c975bcbb61b0af4da5a43799982b8b8c1e7f7f127273006667',
  warmGreys: 'dcd4d0cec5c1c0b8b4b3aaa7a59c9998908c8b827f7e7673726866665c5a59504e',
  goldGreen: 'f4d166d5ca60b6c35c98bb597cb25760a6564b9c533f8f4f33834a257740146c36',
  goldOrange: 'f4d166f8be5cf8aa4cf5983bf3852aef701be2621fd65322c54923b142239e3a26',
  goldRed: 'f4d166f6be59f9aa51fc964ef6834bee734ae56249db5247cf4244c43141b71d3e',
  lightGreyRed: 'efe9e6e1dad7d5cbc8c8bdb9bbaea9cd967ddc7b43e15f19df4011dc000b',
  lightGreyTeal: 'e4eaead6dcddc8ced2b7c2c7a6b4bc64b0bf22a6c32295c11f85be1876bc',
  lightMulti: 'e0f1f2c4e9d0b0de9fd0e181f6e072f6c053f3993ef77440ef4a3c',
  lightOrange: 'f2e7daf7d5baf9c499fab184fa9c73f68967ef7860e8645bde515bd43d5b',
  lightTealBlue: 'e3e9e0c0dccf9aceca7abfc859afc0389fb9328dad2f7ca0276b95255988',
  darkBlue: '3232322d46681a5c930074af008cbf05a7ce25c0dd38daed50f3faffffff',
  darkGold: '3c3c3c584b37725e348c7631ae8b2bcfa424ecc31ef9de30fff184ffffff',
  darkGreen: '3a3a3a215748006f4d048942489e4276b340a6c63dd2d836ffeb2cffffaa',
  darkMulti: '3737371f5287197d8c29a86995ce3fffe800ffffff',
  darkRed: '3434347036339e3c38cc4037e75d1eec8620eeab29f0ce32ffeb2c'
};
const discrete = {
  category10: '1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf',
  category20: '1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5',
  category20b: '393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6',
  category20c: '3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9',
  tableau10: '4c78a8f58518e4575672b7b254a24beeca3bb279a2ff9da69d755dbab0ac',
  tableau20: '4c78a89ecae9f58518ffbf7954a24b88d27ab79a20f2cf5b43989483bcb6e45756ff9d9879706ebab0acd67195fcbfd2b279a2d6a5c99e765fd8b5a5',
  accent: '7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666',
  dark2: '1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666',
  paired: 'a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928',
  pastel1: 'fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2',
  pastel2: 'b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc',
  set1: 'e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999',
  set2: '66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3',
  set3: '8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f'
};

function colors(palette) {
  const n = palette.length / 6 | 0,
    c = new Array(n);
  for (let i = 0; i < n;) {
    c[i] = '#' + palette.slice(i * 6, ++i * 6);
  }
  return c;
}
function apply(_, f) {
  for (const k in _) scheme(k, f(_[k]));
}
const schemes = {};
apply(discrete, colors);
apply(continuous, _ => interpolateColors(colors(_)));
function scheme(name, scheme) {
  name = name && name.toLowerCase();
  if (arguments.length > 1) {
    schemes[name] = scheme;
    return this;
  } else {
    return schemes[name];
  }
}

const SymbolLegend = 'symbol';
const DiscreteLegend = 'discrete';
const GradientLegend = 'gradient';

const defaultFormatter = value => isArray(value) ? value.map(v => String(v)) : String(value);
const ascending = (a, b) => a[1] - b[1];
const descending = (a, b) => b[1] - a[1];

/**
 * Determine the tick count or interval function.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} count - The desired tick count or interval specifier.
 * @param {number} minStep - The desired minimum step between tick values.
 * @return {*} - The tick count or interval function.
 */
function tickCount(scale, count, minStep) {
  let step;
  if (isNumber(count)) {
    if (scale.bins) {
      count = Math.max(count, scale.bins.length);
    }
    if (minStep != null) {
      count = Math.min(count, Math.floor(span(scale.domain()) / minStep || 1));
    }
  }
  if (isObject(count)) {
    step = count.step;
    count = count.interval;
  }
  if (isString(count)) {
    count = scale.type === Time ? timeInterval(count) : scale.type == UTC ? utcInterval(count) : error('Only time and utc scales accept interval strings.');
    if (step) count = count.every(step);
  }
  return count;
}

/**
 * Filter a set of candidate tick values, ensuring that only tick values
 * that lie within the scale range are included.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {Array<*>} ticks - The candidate tick values.
 * @param {*} count - The tick count or interval function.
 * @return {Array<*>} - The filtered tick values.
 */
function validTicks(scale, ticks, count) {
  let range = scale.range(),
    lo = range[0],
    hi = peek(range),
    cmp = ascending;
  if (lo > hi) {
    range = hi;
    hi = lo;
    lo = range;
    cmp = descending;
  }
  lo = Math.floor(lo);
  hi = Math.ceil(hi);

  // filter ticks to valid values within the range
  // additionally sort ticks in range order (#2579)
  ticks = ticks.map(v => [v, scale(v)]).filter(_ => lo <= _[1] && _[1] <= hi).sort(cmp).map(_ => _[0]);
  if (count > 0 && ticks.length > 1) {
    const endpoints = [ticks[0], peek(ticks)];
    while (ticks.length > count && ticks.length >= 3) {
      ticks = ticks.filter((_, i) => !(i % 2));
    }
    if (ticks.length < 3) {
      ticks = endpoints;
    }
  }
  return ticks;
}

/**
 * Generate tick values for the given scale and approximate tick count or
 * interval value. If the scale has a 'ticks' method, it will be used to
 * generate the ticks, with the count argument passed as a parameter. If the
 * scale lacks a 'ticks' method, the full scale domain will be returned.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} [count] - The approximate number of desired ticks.
 * @return {Array<*>} - The generated tick values.
 */
function tickValues(scale, count) {
  return scale.bins ? validTicks(scale, scale.bins) : scale.ticks ? scale.ticks(count) : scale.domain();
}

/**
 * Generate a label format function for a scale. If the scale has a
 * 'tickFormat' method, it will be used to generate the formatter, with the
 * count and specifier arguments passed as parameters. If the scale lacks a
 * 'tickFormat' method, the returned formatter performs simple string coercion.
 * If the input scale is a logarithmic scale and the format specifier does not
 * indicate a desired decimal precision, a special variable precision formatter
 * that automatically trims trailing zeroes will be generated.
 * @param {Scale} scale - The scale for which to generate the label formatter.
 * @param {*} [count] - The approximate number of desired ticks.
 * @param {string} [specifier] - The format specifier. Must be a legal d3
 *   specifier string (see https://github.com/d3/d3-format#formatSpecifier) or
 *   time multi-format specifier object.
 * @return {function(*):string} - The generated label formatter.
 */
function tickFormat(locale, scale, count, specifier, formatType, noSkip) {
  const type = scale.type;
  let format = defaultFormatter;
  if (type === Time || formatType === Time) {
    format = locale.timeFormat(specifier);
  } else if (type === UTC || formatType === UTC) {
    format = locale.utcFormat(specifier);
  } else if (isLogarithmic(type)) {
    const varfmt = locale.formatFloat(specifier);
    if (noSkip || scale.bins) {
      format = varfmt;
    } else {
      const test = tickLog(scale, count, false);
      format = _ => test(_) ? varfmt(_) : '';
    }
  } else if (scale.tickFormat) {
    // if d3 scale has tickFormat, it must be continuous
    const d = scale.domain();
    format = locale.formatSpan(d[0], d[d.length - 1], count, specifier);
  } else if (specifier) {
    format = locale.format(specifier);
  }
  return format;
}
function tickLog(scale, count, values) {
  const ticks = tickValues(scale, count),
    base = scale.base(),
    logb = Math.log(base),
    k = Math.max(1, base * count / ticks.length);

  // apply d3-scale's log format filter criteria
  const test = d => {
    let i = d / Math.pow(base, Math.round(Math.log(d) / logb));
    if (i * base < base - 0.5) i *= base;
    return i <= k;
  };
  return values ? ticks.filter(test) : test;
}

const symbols = {
  [Quantile]: 'quantiles',
  [Quantize]: 'thresholds',
  [Threshold]: 'domain'
};
const formats = {
  [Quantile]: 'quantiles',
  [Quantize]: 'domain'
};
function labelValues(scale, count) {
  return scale.bins ? binValues(scale.bins) : scale.type === Log ? tickLog(scale, count, true) : symbols[scale.type] ? thresholdValues(scale[symbols[scale.type]]()) : tickValues(scale, count);
}
function thresholdFormat(locale, scale, specifier) {
  const _ = scale[formats[scale.type]](),
    n = _.length;
  let d = n > 1 ? _[1] - _[0] : _[0],
    i;
  for (i = 1; i < n; ++i) {
    d = Math.min(d, _[i] - _[i - 1]);
  }

  // tickCount = 3 ticks times 10 for increased resolution
  return locale.formatSpan(0, d, 3 * 10, specifier);
}
function thresholdValues(thresholds) {
  const values = [-Infinity].concat(thresholds);
  values.max = +Infinity;
  return values;
}
function binValues(bins) {
  const values = bins.slice(0, -1);
  values.max = peek(bins);
  return values;
}
const isDiscreteRange = scale => symbols[scale.type] || scale.bins;
function labelFormat(locale, scale, count, type, specifier, formatType, noSkip) {
  const format = formats[scale.type] && formatType !== Time && formatType !== UTC ? thresholdFormat(locale, scale, specifier) : tickFormat(locale, scale, count, specifier, formatType, noSkip);
  return type === SymbolLegend && isDiscreteRange(scale) ? formatRange(format) : type === DiscreteLegend ? formatDiscrete(format) : formatPoint(format);
}
const formatRange = format => (value, index, array) => {
  const limit = get(array[index + 1], get(array.max, +Infinity)),
    lo = formatValue(value, format),
    hi = formatValue(limit, format);
  return lo && hi ? lo + ' \u2013 ' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
};
const get = (value, dflt) => value != null ? value : dflt;
const formatDiscrete = format => (value, index) => index ? format(value) : null;
const formatPoint = format => value => format(value);
const formatValue = (value, format) => Number.isFinite(value) ? format(value) : null;
function labelFraction(scale) {
  const domain = scale.domain(),
    count = domain.length - 1;
  let lo = +domain[0],
    hi = +peek(domain),
    span = hi - lo;
  if (scale.type === Threshold) {
    const adjust = count ? span / count : 0.1;
    lo -= adjust;
    hi += adjust;
    span = hi - lo;
  }
  return value => (value - lo) / span;
}

function format(locale, scale, specifier, formatType) {
  const type = formatType || scale.type;

  // replace abbreviated time specifiers to improve screen reader experience
  if (isString(specifier) && isTemporal(type)) {
    specifier = specifier.replace(/%a/g, '%A').replace(/%b/g, '%B');
  }
  return !specifier && type === Time ? locale.timeFormat('%A, %d %B %Y, %X') : !specifier && type === UTC ? locale.utcFormat('%A, %d %B %Y, %X UTC') : labelFormat(locale, scale, 5, null, specifier, formatType, true);
}
function domainCaption(locale, scale, opt) {
  opt = opt || {};
  const max = Math.max(3, opt.maxlen || 7),
    fmt = format(locale, scale, opt.format, opt.formatType);

  // if scale breaks domain into bins, describe boundaries
  if (isDiscretizing(scale.type)) {
    const v = labelValues(scale).slice(1).map(fmt),
      n = v.length;
    return `${n} boundar${n === 1 ? 'y' : 'ies'}: ${v.join(', ')}`;
  }

  // if scale domain is discrete, list values
  else if (isDiscrete(scale.type)) {
    const d = scale.domain(),
      n = d.length,
      v = n > max ? d.slice(0, max - 2).map(fmt).join(', ') + ', ending with ' + d.slice(-1).map(fmt) : d.map(fmt).join(', ');
    return `${n} value${n === 1 ? '' : 's'}: ${v}`;
  }

  // if scale domain is continuous, describe value range
  else {
    const d = scale.domain();
    return `values from ${fmt(d[0])} to ${fmt(peek(d))}`;
  }
}

export { Band, BinOrdinal, DiscreteLegend, Diverging, GradientLegend, Identity, Linear, Log, Ordinal, Point, Pow, Quantile, Quantize, Sequential, Sqrt, SymbolLegend, Symlog, Threshold, Time, UTC, bandSpace, domainCaption, interpolate, interpolateColors, interpolateRange, isContinuous, isDiscrete, isDiscretizing, isInterpolating, isLogarithmic, isQuantile, isRegisteredScale, isTemporal, isValidScaleType, labelFormat, labelFraction, labelValues, quantizeInterpolator, registerScale, scale, scaleCopy, scaleFraction, scheme, tickCount, tickFormat, tickValues, validTicks };
