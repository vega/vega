import { field } from 'vega-util';

var LT = 'lt',
    LTE  = 'lte',
    GT = 'gt',
    GTE = 'gte',
    EQUAL = 'equal',
    NEQUAL = 'nequal'


var ops = {};
ops[LT] = '<';
ops[LTE] = '<=';
ops[GT] = '>';
ops[GTE] = '>=';
ops[EQUAL] = '==';
ops[NEQUAL] = '!=';

export function comparisonTest(store, datum, def) {
    var data = this.context.data[store],
        aggregates = data ? data.values.value : [];

    if (!aggregates.length) return true;

    var sval = aggregates[0][def.sfieldAggregate]
    var on = def.on;
    var getter = field(on);
    var dval = getter(datum);

    var result = new Function('dval', 'sval', `return Boolean(dval ${ops[def.operator]} sval)`);
    return result(dval, sval)
}
