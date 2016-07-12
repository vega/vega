/**
 * Parse an expression given the argument signature and body code.
 */
export default function parseExpression(args, code, context) {
  var fn = Function.apply(null, args.concat('return(' + code + ');'));
  return context ? fn.bind(context) : fn;
}

/**
 * Parse an expression applied to an event stream.
 */
export function eventExpression(code, context) {
  return parseExpression(['event'], code, context);
}

/**
 * Parse an expression used to handle an event-driven operator update.
 */
export function handlerExpression(code, context) {
  return parseExpression(['_', 'event', 'datum'], code, context);
}

/**
 * Parse an expression used to update an operator value.
 */
export function operatorExpression(code, context) {
  return parseExpression(['_'], code, context);
}

/**
 * Parse an expression provided as an operator parameter value.
 */
export function parameterExpression(code, context) {
  return parseExpression(['datum', '_'], code, context);
}

/**
 * Parse an expression that performs visual encoding.
 */
export function encodeExpression(code, context) {
  var fn = Function.apply(null, ['item', '_', code]);
  return context ? fn.bind(context) : fn;
}
