/**
 * Parse an expression given the argument signature and body code.
 */
export default function expression(args, code, ctx) {
  // wrap code in return statement if expression does not terminate
  if (code[code.length-1] !== ';') {
    code = 'return(' + code + ');';
  }
  var fn = Function.apply(null, args.concat(code));
  return ctx && ctx.functions ? fn.bind(ctx.functions) : fn;
}

/**
 * Parse an expression used to update an operator value.
 */
export function operatorExpression(code, ctx) {
  return expression(['_'], code, ctx);
}

/**
 * Parse an expression provided as an operator parameter value.
 */
export function parameterExpression(code, ctx) {
  return expression(['datum', '_'], code, ctx);
}

/**
 * Parse an expression applied to an event stream.
 */
export function eventExpression(code, ctx) {
  return expression(['event'], code, ctx);
}

/**
 * Parse an expression used to handle an event-driven operator update.
 */
export function handlerExpression(code, ctx) {
  return expression(['_', 'event'], code, ctx);
}

/**
 * Parse an expression that performs visual encoding.
 */
export function encodeExpression(code, ctx) {
  return expression(['item', '_'], code, ctx);
}
