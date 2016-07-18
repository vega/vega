import entry from './entry';
import set from './set';
import parseExpression from '../expression';

export default function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule, index) {
    var value = entry(channel, rule, scope, params, fields),
        expr, name, p;

    if (index > 0) code += 'else ';

    if (rule.test) {
      // TODO: provide prefix for codegen of signal references?
      expr = parseExpression(rule.test, scope);
      if (expr.$fields) {
        expr.fields.forEach(function(f) { fields[f] = 1; });
      }
      // TODO data set dependencies (e.g., for lookups)

      // TODO remove hard-wiring once expression parser is added
      p = {'active': 'active'}; // p = expr.$params;
      for (name in p) {
        params[p[name]] = scope.signalRef(name);
      }
      code += 'if(' + expr.$expr + ')';
    }

    code += '{' + set('o', channel, value) + '}';
  });

  return code;
}
