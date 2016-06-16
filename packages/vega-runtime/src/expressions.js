export default function parseExpression(args, code, context) {
  var fn = Function.apply(null, args.concat('return ' + code + ';'));
  return context ? fn.bind(context) : fn;
}

export function operatorExpression(code, context) {
  return parseExpression(['_'], code, context);
}

export function handlerExpression(code, context) {
  return parseExpression(['_', 'event', 'datum'], code, context);
}

export function paramExpression(code, context) {
  return parseExpression(['datum', '_'], code, context);
}

export function eventExpression(code, context) {
  return parseExpression(['event'], code, context);
}
