import {codeGenerator, codegenParams} from './codegen.js';
import {SignalPrefix} from './constants.js';
import {CallExpression, parseExpression} from 'vega-expression';
import {error, extend, hasOwnProperty, isString, stringValue} from 'vega-util';

export default function(expr, scope) {
  const params = {};

  // parse the expression to an abstract syntax tree (ast)
  let ast;
  try {
    expr = isString(expr) ? expr : (stringValue(expr) + '');
    ast = parseExpression(expr);
  } catch (err) {
    error('Expression parse error: ' + expr);
  }

  // analyze ast function calls for dependencies
  ast.visit(node => {
    if (node.type !== CallExpression) return;
    const name = node.callee.name,
          visit = codegenParams.visitors[name];
    if (visit) visit(name, node.arguments, scope, params);
  });

  // perform code generation
  const gen = codeGenerator(ast);

  // collect signal dependencies
  gen.globals.forEach(name => {
    const signalName = SignalPrefix + name;
    if (!hasOwnProperty(params, signalName) && scope.getSignal(name)) {
      params[signalName] = scope.signalRef(name);
    }
  });

  // return generated expression code and dependencies
  return {
    $expr:   extend({code: gen.code}, scope.options.ast ? {ast} : null),
    $fields: gen.fields,
    $params: params
  };
}
