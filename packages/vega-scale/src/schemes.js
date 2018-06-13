import {
  category20, category20b, category20c,
  tableau10, tableau20,
  blueOrange
} from './palettes';
import * as _ from 'd3-scale-chromatic';
import {interpolateRgbBasis} from 'd3-interpolate';
import {peek} from 'vega-util';

var discretized = {
  blueorange:  blueOrange
};

var schemes = {
  // d3 categorical palettes
  category10:  _.schemeCategory10,
  accent:      _.schemeAccent,
  dark2:       _.schemeDark2,
  paired:      _.schemePaired,
  pastel1:     _.schemePastel1,
  pastel2:     _.schemePastel2,
  set1:        _.schemeSet1,
  set2:        _.schemeSet2,
  set3:        _.schemeSet3,

  // additional categorical palettes
  category20:  category20,
  category20b: category20b,
  category20c: category20c,
  tableau10:   tableau10,
  tableau20:   tableau20,

  // sequential multi-hue interpolators
  viridis:     _.interpolateViridis,
  magma:       _.interpolateMagma,
  inferno:     _.interpolateInferno,
  plasma:      _.interpolatePlasma,

  // cyclic interpolators
  rainbow:     _.interpolateRainbow,
  sinebow:     _.interpolateSinebow,

  // extended interpolators
  blueorange:  interpolateRgbBasis(peek(blueOrange))
};

function add(name, suffix) {
  schemes[name] = _['interpolate' + suffix];
  discretized[name] = _['scheme' + suffix];
}

// sequential single-hue
add('blues',    'Blues');
add('greens',   'Greens');
add('greys',    'Greys');
add('purples',  'Purples');
add('reds',     'Reds');
add('oranges',  'Oranges');

// diverging
add('brownbluegreen',    'BrBG');
add('purplegreen',       'PRGn');
add('pinkyellowgreen',   'PiYG');
add('purpleorange',      'PuOr');
add('redblue',           'RdBu');
add('redgrey',           'RdGy');
add('redyellowblue',     'RdYlBu');
add('redyellowgreen',    'RdYlGn');
add('spectral',          'Spectral');

// sequential multi-hue
add('bluegreen',         'BuGn');
add('bluepurple',        'BuPu');
add('greenblue',         'GnBu');
add('orangered',         'OrRd');
add('purplebluegreen',   'PuBuGn');
add('purpleblue',        'PuBu');
add('purplered',         'PuRd');
add('redpurple',         'RdPu');
add('yellowgreenblue',   'YlGnBu');
add('yellowgreen',       'YlGn');
add('yelloworangebrown', 'YlOrBr');
add('yelloworangered',   'YlOrRd');

export function scheme(name, scheme) {
  if (arguments.length > 1) {
    schemes[name] = scheme;
    return this;
  }

  var part = name.split('-');
  name = part[0];
  part = +part[1] + 1;

  return part && discretized.hasOwnProperty(name) ? discretized[name][part-1]
    : !part && schemes.hasOwnProperty(name) ? schemes[name]
    : undefined;
}

export function schemeDiscretized(name, schemeArray, interpolator) {
  if (arguments.length > 1) {
    discretized[name] = schemeArray;
    schemes[name] = interpolator || interpolateRgbBasis(peek(schemeArray));
    return this;
  }

  return discretized.hasOwnProperty(name)
    ? discretized[name]
    : undefined;
}
