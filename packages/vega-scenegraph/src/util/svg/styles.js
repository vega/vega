export const stylesAttr = {
  fill:             'fill',
  fillOpacity:      'fill-opacity',
  stroke:           'stroke',
  strokeOpacity:    'stroke-opacity',
  strokeWidth:      'stroke-width',
  strokeCap:        'stroke-linecap',
  strokeJoin:       'stroke-linejoin',
  strokeDash:       'stroke-dasharray',
  strokeDashOffset: 'stroke-dashoffset',
  strokeMiterLimit: 'stroke-miterlimit',
  opacity:          'opacity'
};

export const stylesCss = {
  blend:            'mix-blend-mode'
};

// ensure miter limit default is consistent with canvas (#2498);
// both renderers use the SVG default limit of 4
export const rootAttributes = {
  'fill': 'none',
  'stroke-miterlimit': 4
};
