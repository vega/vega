import {field} from 'vega-util';

// Registers vega-util field accessors to protect against XSS attacks
const SELECTION_GETTER = Symbol('vega_selection_getter');
export function getter(f) {
  if (!f.getter || !f.getter[SELECTION_GETTER]) {
    f.getter = field(f.field);
    f.getter[SELECTION_GETTER] = true;
  }

  return f.getter;
}

export const Intersect = 'intersect';
export const Union = 'union';
export const VlMulti = 'vlMulti';
export const VlPoint = 'vlPoint';
export const Or = 'or';
export const And = 'and';

export const SelectionId = '_vgsid_';
export const $selectionId = field(SelectionId);
