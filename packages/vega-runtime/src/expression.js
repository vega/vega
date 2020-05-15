import {adjustSpatial} from './util';
import {compare, field, key, stringValue} from 'vega-util';

function expression(ctx, args, code) {
  // wrap code in return statement if expression does not terminate
  if (code[code.length-1] !== ';') {
    code = 'return(' + code + ');';
  }
  var fn = Function.apply(null, args.concat(code));
  return ctx && ctx.functions ? fn.bind(ctx.functions) : fn;
}

// optimized code generators for access and comparison
const opt = {
  get(path) {
    const ref = `[${path.map(stringValue).join('][')}]`;
    const get = Function('_', `return _${ref};`);
    get.path = ref;
    return get;
  },
  comparator(fields, orders) {
    let t;
    const map = (f, i) => {
      const o = orders[i];
      let u, v;
      if (f.path) {
        u = `a${f.path}`;
        v = `b${f.path}`;
      } else {
        (t = t || {})['f'+i] = f;
        u = `this.f${i}(a)`;
        v = `this.f${i}(b)`;
      }
      return _compare(u, v, -o, o);
    };

    const fn = Function('a', 'b', 'var u, v; return '
      + fields.map(map).join('') + '0;');
    return t ? fn.bind(t) : fn;
  }
};

// generate code for comparing a single field
function _compare(u, v, lt, gt) {
  return `((u = ${u}) < (v = ${v}) || u == null) && v != null ? ${lt}
  : (u > v || v == null) && u != null ? ${gt}
  : ((v = v instanceof Date ? +v : v), (u = u instanceof Date ? +u : u)) !== u && v === v ? ${lt}
  : v !== v && u === u ? ${gt} : `;
}

export default {
  /**
   * Parse an expression used to update an operator value.
   */
  operatorExpression(expr) {
    return expression(this, ['_'], expr.code);
  },

  /**
   * Parse an expression provided as an operator parameter value.
   */
  parameterExpression(expr) {
    return expression(this, ['datum', '_'], expr.code);
  },

  /**
   * Parse an expression applied to an event stream.
   */
  eventExpression(expr) {
    return expression(this, ['event'], expr.code);
  },

  /**
   * Parse an expression used to handle an event-driven operator update.
   */
  handlerExpression(expr) {
    const code = `var datum=event.item&&event.item.datum;return ${expr.code};`;
    return expression(this, ['_', 'event'], code);
  },

  /**
   * Parse an expression that performs visual encoding.
   */
  encodeExpression(encode) {
    const {marktype, channels} = encode;

    let code = 'var o=item,datum=o.datum,m=0,$;';
    for (const name in channels) {
      const o ='o[' + stringValue(name) + ']';
      code += `$=${channels[name].code};if(${o}!==$)${o}=$,m=1;`;
    }
    code += adjustSpatial(channels, marktype);
    code += 'return m;';

    return expression(this, ['item', '_'], code);
  },

  /**
   * Parse a comparator specification.
   */
  compareExpression($compare, $order) {
    return compare($compare, $order, opt);
  },

  /**
   * Parse a field accessor specification.
   */
  fieldExpression($field, $name) {
    return field($field, $name, opt);
  },

  /**
   * Parse a key accessor specification.
   */
  keyExpression($key, $flat) {
    return key($key, $flat, opt);
  }
};
