import {toSet} from 'vega-util';

export var marktypes = toSet([
  '*',
  'arc',
  'area',
  'group',
  'image',
  'line',
  'path',
  'rect',
  'rule',
  'symbol',
  'text'
]);

export function isMarkType(type) {
  return marktypes.hasOwnProperty(type);
}
