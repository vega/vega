import Constants from './constants';
import Functions from './functions';
import {error, hasOwnProperty, isFunction, isString, toSet} from 'vega-util';

function stripQuotes(s) {
  const n = s && s.length - 1;
  return n && ((s[0] === '"' && s[n] === '"') || (s[0] === "'" && s[n] === "'")) ? s.slice(1, -1) : s;
}

export default function (opt) {
  opt = opt || {};

  const whitelist = opt.whitelist ? toSet(opt.whitelist) : {};
  const blacklist = opt.blacklist ? toSet(opt.blacklist) : {};
  const constants = opt.constants || Constants;
  const functions = (opt.functions || Functions)(visit);
  const globalvar = opt.globalvar;
  const fieldvar = opt.fieldvar;
  let globals = {};
  let fields = {};
  let memberDepth = 0;

  const outputGlobal = isFunction(globalvar)
    ? globalvar
    : function (id) {
        return globalvar + '["' + id + '"]';
      };

  function visit(ast) {
    if (isString(ast)) return ast;
    const generator = Generators[ast.type];
    if (generator == null) error('Unsupported type: ' + ast.type);
    return generator(ast);
  }

  const Generators = {
    Literal: function (n) {
      return n.raw;
    },

    Identifier: function (n) {
      const id = n.name;
      if (memberDepth > 0) {
        return id;
      } else if (hasOwnProperty(blacklist, id)) {
        return error('Illegal identifier: ' + id);
      } else if (hasOwnProperty(constants, id)) {
        return constants[id];
      } else if (hasOwnProperty(whitelist, id)) {
        return id;
      } else {
        globals[id] = 1;
        return outputGlobal(id);
      }
    },

    MemberExpression: function (n) {
      const d = !n.computed;
      const o = visit(n.object);
      if (d) memberDepth += 1;
      const p = visit(n.property);
      if (o === fieldvar) {
        // strip quotes to sanitize field name (#1653)
        fields[stripQuotes(p)] = 1;
      }
      if (d) memberDepth -= 1;
      return o + (d ? '.' + p : '[' + p + ']');
    },

    CallExpression: function (n) {
      if (n.callee.type !== 'Identifier') {
        error('Illegal callee type: ' + n.callee.type);
      }
      const callee = n.callee.name;
      const args = n.arguments;
      const fn = hasOwnProperty(functions, callee) && functions[callee];
      if (!fn) error('Unrecognized function: ' + callee);
      return isFunction(fn) ? fn(args) : fn + '(' + args.map(visit).join(',') + ')';
    },

    ArrayExpression: function (n) {
      return '[' + n.elements.map(visit).join(',') + ']';
    },

    BinaryExpression: function (n) {
      return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
    },

    UnaryExpression: function (n) {
      return '(' + n.operator + visit(n.argument) + ')';
    },

    ConditionalExpression: function (n) {
      return '(' + visit(n.test) + '?' + visit(n.consequent) + ':' + visit(n.alternate) + ')';
    },

    LogicalExpression: function (n) {
      return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
    },

    ObjectExpression: function (n) {
      return '{' + n.properties.map(visit).join(',') + '}';
    },

    Property: function (n) {
      memberDepth += 1;
      const k = visit(n.key);
      memberDepth -= 1;
      return k + ':' + visit(n.value);
    }
  };

  function codegen(ast) {
    const result = {
      code: visit(ast),
      globals: Object.keys(globals),
      fields: Object.keys(fields)
    };
    globals = {};
    fields = {};
    return result;
  }

  codegen.functions = functions;
  codegen.constants = constants;

  return codegen;
}
