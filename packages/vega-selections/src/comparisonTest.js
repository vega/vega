import {error, field} from 'vega-util';

export function comparisonTest(store, datum, def) {
    const data = this.context.data[store],
          aggregates = data ? data.values.value : [];
  
    if (!aggregates.length) return true;

    const b = aggregates[0][def.sfieldAggregate],
          a = field(def.on)(datum);

    switch (def.operator) {
      case '<':   return a < b;
      case '<=':  return a <= b;
      case '>':   return a > b;
      case '>=':  return a >= b;
      case '==':  return a == b;
      case '!=':  return a != b;
      default:    error('Unrecognized comparison operator: ' + def.operator);
    }
}
