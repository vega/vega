import {CallExpression, parse} from 'vega-expression';
import {codeGenerator, codegenParams, SignalPrefix} from 'vega-functions';
import {error, hasOwnProperty, isString, stringValue} from 'vega-util';

export default function(expr, scope, preamble) {
  var params = {}, ast, gen;

  // parse the expression to an abstract syntax tree (ast)
  try {
    expr = isString(expr) ? expr : (stringValue(expr) + '');
    ast = parse(expr);
  } catch (err) {
    error('Expression parse error: ' + expr);
  }

  // analyze ast function calls for dependencies
  ast.visit(function visitor(node) {
    if (node.type !== CallExpression) return;
    var name = node.callee.name,
        visit = codegenParams.visitors[name];
    if (visit) visit(name, node.arguments, scope, params);
  });

  // perform code generation
  gen = codeGenerator(ast);

  // collect signal dependencies
  gen.globals.forEach(function(name) {
    var signalName = SignalPrefix + name;
    if (!hasOwnProperty(params, signalName) && scope.getSignal(name)) {
      params[signalName] = scope.signalRef(name);
    }
  });

  // return generated expression code and dependencies
  return {
    $expr:   preamble ? preamble + 'return(' + gen.code + ');' : gen.code,
    $fields: gen.fields,
    $params: params
  };
}
