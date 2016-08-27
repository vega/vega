import * as $ from 'd3-scale';
import * as _ from 'd3-scale-chromatic';

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

  // d3 built-in interpolators
  cubehelix:   $.interpolateCubehelixDefault,
  rainbow:     $.interpolateRainbow,
  warm:        $.interpolateWarm,
  cool:        $.interpolateCool,
  viridis:     $.interpolateViridis,
  magma:       $.interpolateMagma,
  inferno:     $.interpolateInferno,
  plasma:      $.interpolatePlasma,

  // diverging
  brbg:        _.interpolateBrBG,
  prgn:        _.interpolatePRGn,
  piyg:        _.interpolatePiYG,
  puor:        _.interpolatePuOr,
  rdbu:        _.interpolateRdBu,
  rdgy:        _.interpolateRdGy,
  rdylbu:      _.interpolateRdYlBu,
  rdylgn:      _.interpolateRdYlGn,
  spectral:    _.interpolateSpectral,

  // repeat with friendlier names
  brownbluegreen:  _.interpolateBrBG,
  purplegreen:     _.interpolatePRGn,
  pinkyellowgreen: _.interpolatePiYG,
  purpleorange:    _.interpolatePuOr,
  redblue:         _.interpolateRdBu,
  redgrey:         _.interpolateRdGy,
  redyellowblue:   _.interpolateRdYlBu,
  redyellowgreen:  _.interpolateRdYlGn,

  // sequential multi-hue
  bugn:        _.interpolateBuGn,
  bupu:        _.interpolateBuPu,
  gnbu:        _.interpolateGnBu,
  orrd:        _.interpolateOrRd,
  pubugn:      _.interpolatePuBuGn,
  pubu:        _.interpolatePuBu,
  purd:        _.interpolatePuRd,
  rdpu:        _.interpolateRdPu,
  ylgnbu:      _.interpolateYlGnBu,
  ylgn:        _.interpolateYlGn,
  ylorbr:      _.interpolateYlOrBr,
  ylorrd:      _.interpolateYlOrRd,

  // repeat with friendlier names
  bluegreen:         _.interpolateBuGn,
  bluepurple:        _.interpolateBuPu,
  greenblue:         _.interpolateGnBu,
  orangered:         _.interpolateOrRd,
  purplebluegreen:   _.interpolatePuBuGn,
  purpleblue:        _.interpolatePuBu,
  purplered:         _.interpolatePuRd,
  redpurple:         _.interpolateRdPu,
  yellowgreenblue:   _.interpolateYlGnBu,
  yellowgreen:       _.interpolateYlGn,
  yelloworangebrown: _.interpolateYlOrBr,
  yelloworangered:   _.interpolateYlOrRd,

  // sequential single-hue
  blues:       _.interpolateBlues,
  greens:      _.interpolateGreens,
  greys:       _.interpolateGreys,
  purples:     _.interpolatePurples,
  reds:        _.interpolateReds,
  oranges:     _.interpolateOranges
};

export default function scheme(name, scheme) {
  name = String(name).toLowerCase();
  return arguments.length > 1 ? (schemes[name] = scheme, this)
    : schemes.hasOwnProperty(name) ? schemes[name] : null;
}
