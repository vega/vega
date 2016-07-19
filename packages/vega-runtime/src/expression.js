/**
 * Parse an expression given the argument signature and body code.
 */
export default function expression(args, code, context) {
  // wrap code in return statement if expression does not terminate
  if (code[code.length-1] !== ';') {
    code = 'return(' + code + ');';
  }
  var fn = Function.apply(null, args.concat(code));
  return context ? fn.bind(context) : fn;
}

/**
 * Parse an expression used to update an operator value.
 */
export function operatorExpression(code, context) {
  return expression(['_'], code, context);
}

/**
 * Parse an expression provided as an operator parameter value.
 */
export function parameterExpression(code, context) {
  return expression(['datum', '_'], code, context);
}

/**
 * Parse an expression applied to an event stream.
 */
export function eventExpression(code, context) {
  return expression(['event'], code, context);
}

/**
 * Parse an expression used to handle an event-driven operator update.
 */
export function handlerExpression(code, context) {
  return expression(['_', 'event'], code, context);
}

/**
 * Parse an expression that performs visual encoding.
 */
export function encodeExpression(code, context) {
  return expression(['item', '_'], code, context);
}
