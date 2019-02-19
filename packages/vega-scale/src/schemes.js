import {
  category20, category20b, category20c,
  tableau10, tableau20,
  blueOrange
} from './palettes';
import { density_light_orange, density_light_grayred, density_light_blueteal,
  density_light_grayteal, density_light_multicolor, density_dark_blue,
  density_dark_red, density_dark_green, density_dark_gold,
  density_dark_multicolor
} from './densitySchemes';
import {blue, orange, green, red, purple, brown, gray, gray_warm, teal,
  blue_teal, orange_gold, green_gold, red_gold, orange_blue_diverging,
  red_green_diverging, green_blue_diverging, red_blue_diverging, red_black,
  gold_purple_diverging, red_green_gold_diverging, sunrise_sunset_diverging,
  orange_blue_white_diverging, red_green_white_diverging,
  green_blue_white_diverging, red_blue_white_diverging,
  red_black_white_diverging
} from './symbolSchemes';
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

  // Tableau density map schemes
  density_light_orange:     density_light_orange,
  density_light_grayred:    density_light_grayred,
  density_light_blueteal:   density_light_blueteal,
  density_light_grayteal:   density_light_grayteal,
  density_light_multicolor: density_light_multicolor,
  density_dark_blue:        density_dark_blue,
  density_dark_red:         density_dark_red,
  density_dark_green:       density_dark_green,
  density_dark_gold:        density_dark_gold,
  density_dark_multicolor:  density_dark_multicolor,

  // Tableau symbol schemes
  tableau_blue:         blue,
  tableau_orange:       orange,
  tableau_green:        green,
  tableau_red:          red,
  tableau_purple:       purple,
  tableau_brown:        brown,
  tableau_gray:         gray,
  tableau_gray_warm:    gray_warm,
  tableau_teal:         teal,
  tableau_blue_teal:    blue_teal,
  tableau_orange_gold:  orange_gold,
  tableau_green_gold:   green_gold,
  tableau_red_gold:     red_gold,
  tableau_red_black:    red_black,

  // Tableau diverging symbol schemes
  tableau_orange_blue:        orange_blue_diverging,
  tableau_red_green:          red_green_diverging,
  tableau_green_blue:         green_blue_diverging,
  tableau_red_blue:           red_blue_diverging,
  tableau_gold_purple:        gold_purple_diverging,
  tableau_red_green_gold:     red_green_gold_diverging,
  tableau_sunrise_sunset:     sunrise_sunset_diverging,
  tableau_orange_blue_white:  orange_blue_white_diverging,
  tableau_red_green_white:    red_green_white_diverging,
  tableau_green_blue_white:   green_blue_white_diverging,
  tableau_red_blue_white:     red_blue_white_diverging,
  tableau_red_black_white:    red_black_white_diverging,

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
