import expression from '../expression';
import {extend} from 'vega-util';

export default function(code, scope, params, fields) {
  var expr = expression(code, scope);
  expr.$fields.forEach(function(name) { fields[name] = 1; });
  extend(params, expr.$params);
  return expr.$expr;
}
