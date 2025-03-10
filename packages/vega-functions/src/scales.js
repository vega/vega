import {ScalePrefix} from './constants.js';
import {scaleVisitor} from './visitors.js';
import {Literal} from 'vega-expression';
import {isFunction, isString, stringValue} from 'vega-util';
import {isRegisteredScale} from 'vega-scale';

/**
 * nameOrFunction must be a string or function that was registered.
 * Return undefined if scale is not recognized.
 */
export function getScale(nameOrFunction, ctx) {

  if (isString(nameOrFunction)) {
    const maybeScale = ctx.scales[nameOrFunction];
    return (maybeScale && isRegisteredScale(maybeScale.value)) ? maybeScale.value : undefined;
  } else if (isFunction(nameOrFunction)) {
    return isRegisteredScale(nameOrFunction) ? nameOrFunction : undefined;
  }

  return undefined;
}

export function internalScaleFunctions(codegen, fnctx, visitors) {
  // add helper method to the 'this' expression function context
  fnctx.__bandwidth = s => s && s.bandwidth ? s.bandwidth() : 0;

  // register AST visitors for internal scale functions
  visitors._bandwidth = scaleVisitor;
  visitors._range = scaleVisitor;
  visitors._scale = scaleVisitor;

  // resolve scale reference directly to the signal hash argument
  const ref = arg => '_[' + (
    arg.type === Literal
      ? stringValue(ScalePrefix + arg.value)
      : stringValue(ScalePrefix) + '+' + codegen(arg)
  ) + ']';

  // define and return internal scale function code generators
  // these internal functions are called by mark encoders
  return {
    _bandwidth: args => `this.__bandwidth(${ref(args[0])})`,
    _range: args => `${ref(args[0])}.range()`,
    _scale: args => `${ref(args[0])}(${codegen(args[1])})`
  };
}
