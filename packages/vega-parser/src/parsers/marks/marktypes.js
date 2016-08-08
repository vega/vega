import {toSet} from 'vega-util';

export var ArcMark = 'arc';
export var AreaMark = 'area';
export var GroupMark = 'group';
export var ImageMark = 'image';
export var LineMark = 'line';
export var PathMark = 'path';
export var RectMark = 'rect';
export var RuleMark = 'rule';
export var SymbolMark = 'symbol';
export var TextMark = 'text';

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
