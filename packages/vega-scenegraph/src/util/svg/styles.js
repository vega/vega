export const styles = {
  'fill':             'fill',
  'fillOpacity':      'fill-opacity',
  'stroke':           'stroke',
  'strokeOpacity':    'stroke-opacity',
  'strokeWidth':      'stroke-width',
  'strokeCap':        'stroke-linecap',
  'strokeJoin':       'stroke-linejoin',
  'strokeDash':       'stroke-dasharray',
  'strokeDashOffset': 'stroke-dashoffset',
  'strokeMiterLimit': 'stroke-miterlimit',
  'opacity':          'opacity',
  'blend':            'mix-blend-mode'
};

export const svgRootClass = 'vega-svg-root';

// ensure miter limit default is consistent with canvas (#2498)
export const defaultCSS = [
  `.${svgRootClass} * { fill: none; }`,
  `.${svgRootClass} tspan { fill: inherit; }`,
  `.${svgRootClass} path { stroke-miterlimit: 10; }`
].join(' ');
