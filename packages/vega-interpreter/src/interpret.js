import Constants from './constants';
import Ops from './ops-binary';
import Unary from './ops-unary';
import Functions from './functions';

const EventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];

const Visitors = {
  Literal: ($, n) => n.value,

  Identifier: ($, n) => {
    const id = n.name;
    return $.memberDepth > 0 ? id
      : id === 'datum' ? $.datum
      : id === 'event' ? $.event
      : id === 'item' ? $.item
      : Constants[id] || $.params['$' + id];
  },

  MemberExpression: ($, n) => {
    const d = !n.computed,
          o = $(n.object);
    if (d) $.memberDepth += 1;
    const p = $(n.property);
    if (d) $.memberDepth -= 1;
    return o[p];
  },

  CallExpression: ($, n) => {
    const args = n.arguments;
    let name = n.callee.name;

    // handle special internal functions used by encoders
    // re-route to corresponding standard function
    if (name.startsWith('_')) {
      name = name.slice(1);
    }

    // special case "if" due to conditional evaluation of branches
    return name === 'if'
      ? ($(args[0]) ? $(args[1]) : $(args[2]))
      : ($.fn[name] || Functions[name]).apply($.fn, args.map($));
  },

  ArrayExpression: ($, n) => n.elements.map($),

  BinaryExpression: ($, n) => Ops[n.operator]($(n.left), $(n.right)),

  UnaryExpression: ($, n) => Unary[n.operator]($(n.argument)),

  ConditionalExpression: ($, n) => $(n.test)
    ? $(n.consequent)
    : $(n.alternate),

  LogicalExpression: ($, n) => n.operator === '&&'
    ? $(n.left) && $(n.right)
    : $(n.left) || $(n.right),

  ObjectExpression: ($, n) => n.properties.reduce((o, p) => {
    $.memberDepth += 1;
    const k = $(p.key);
    $.memberDepth -= 1;
    o[k] = $(p.value);
    return o;
  }, {})
};

export default function(ast, fn, params, datum, event, item) {
  const $ = n => Visitors[n.type]($, n);
  $.memberDepth = 0;
  $.fn = Object.create(fn);
  $.params = params;
  $.datum = datum;
  $.event = event;
  $.item = item;

  // route event functions to annotated vega event context
  EventFunctions.forEach(f => $.fn[f] = (...args) => event.vega[f](...args));

  return $(ast);
}