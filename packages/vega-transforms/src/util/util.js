import {accessorName} from 'vega-util';

// use either provided alias or accessor field name
export function fieldNames(fields, as) {
  if (!fields) return null;
  return fields.map(function(f, i) {
    return as[i] || accessorName(f);
  });
}
