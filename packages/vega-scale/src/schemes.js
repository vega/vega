import {tableau10, tableau20, blueOrange} from './palettes';
import * as $ from 'd3-scale';
import * as _ from 'd3-scale-chromatic';
import {interpolateRgbBasis} from 'd3-interpolate';
import {peek} from 'vega-util';

var discrete = {
  blueorange:  blueOrange
};

var schemes = {
  // d3 built-in categorical palettes
  category10:  $.schemeCategory10,
  category20:  $.schemeCategory20,
  category20b: $.schemeCategory20b,
  category20c: $.schemeCategory20c,

  // extended categorical palettes
  accent:      _.schemeAccent,
  dark2:       _.schemeDark2,
  paired:      _.schemePaired,
  pastel1:     _.schemePastel1,
  pastel2:     _.schemePastel2,
  set1:        _.schemeSet1,
  set2:        _.schemeSet2,
  set3:        _.schemeSet3,
  tableau10:   tableau10,
  tableau20:   tableau20,

  // d3 built-in interpolators
  viridis:     $.interpolateViridis,
  magma:       $.interpolateMagma,
  inferno:     $.interpolateInferno,
  plasma:      $.interpolatePlasma,

  // extended interpolators
  blueorange:  interpolateRgbBasis(peek(blueOrange))
};

function add(name, suffix) {
  schemes[name] = _['interpolate' + suffix];
  discrete[name] = _['scheme' + suffix];
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

export default function(name, scheme) {
  if (arguments.length > 1) return (schemes[name] = scheme, this);

  var part = name.split('-');
  name = part[0];
  part = +part[1] + 1;

  return part && discrete.hasOwnProperty(name) ? discrete[name][part-1]
    : !part && schemes.hasOwnProperty(name) ? schemes[name]
    : undefined;
}
