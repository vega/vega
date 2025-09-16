import Constants from './constants.js';
import Functions from './functions.js';
import {DisallowedObjectProperties, error, hasOwnProperty, isFunction, isString, toSet} from 'vega-util';

function stripQuotes(s) {
  const n = s && s.length - 1;
  return n && (
      (s[0]==='"' && s[n]==='"') ||
      (s[0]==='\'' && s[n]==='\'')
    ) ? s.slice(1, -1) : s;
}

export default function(opt) {
  opt = opt || {};

  const allowed = opt.allowed ? toSet(opt.allowed) : {},
        forbidden = opt.forbidden ? toSet(opt.forbidden) : {},
        constants = opt.constants || Constants,
        functions = (opt.functions || Functions)(visit),
        globalvar = opt.globalvar,
        fieldvar = opt.fieldvar,
        outputGlobal = isFunction(globalvar)
          ? globalvar
          : id => `${globalvar}["${id}"]`,
        // JSON authors are not allowed to set properties with these names, as these are built-in to the JS Object Prototype.
        forbiddenProperties = new Set(
          [...Object.getOwnPropertyNames(Object.prototype)
            .filter(name => typeof Object.prototype[name] === 'function'),
          '__proto__'
          ]
        );

  let globals = {},
      fields = {},
      memberDepth = 0;

  function visit(ast) {
    if (isString(ast)) return ast;
    const generator = Generators[ast.type];
    if (generator == null) error('Unsupported type: ' + ast.type);
    return generator(ast);
  }

  const Generators = {
    Literal: n => n.raw,

    Identifier: n => {
      const id = n.name;
      if (memberDepth > 0) {
        return id;
      } else if (hasOwnProperty(forbidden, id)) {
        return error('Illegal identifier: ' + id);
      } else if (hasOwnProperty(constants, id)) {
        return constants[id];
      } else if (hasOwnProperty(allowed, id)) {
        return id;
      } else {
        globals[id] = 1;
        return outputGlobal(id);
      }
    },

    MemberExpression: n => {
        const d = !n.computed,
              o = visit(n.object);
        if (d) memberDepth += 1;
        const p = visit(n.property);
        if (o === fieldvar) {
          // strip quotes to sanitize field name (#1653)
          fields[stripQuotes(p)] = 1;
        }
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },

    CallExpression: n => {
        if (n.callee.type !== 'Identifier') {
          error('Illegal callee type: ' + n.callee.type);
        }
        const callee = n.callee.name,
              args = n.arguments,
              fn = hasOwnProperty(functions, callee) && functions[callee];
        if (!fn) error('Unrecognized function: ' + callee);
        return isFunction(fn)
          ? fn(args)
          : fn + '(' + args.map(visit).join(',') + ')';
      },

    ArrayExpression: n =>
        '[' + n.elements.map(visit).join(',') + ']',

    BinaryExpression: n =>
        '(' + visit(n.left) + ' ' + n.operator + ' ' + visit(n.right) + ')',

    UnaryExpression: n =>
        '(' + n.operator + visit(n.argument) + ')',

    ConditionalExpression: n =>
        '(' + visit(n.test) +
          '?' + visit(n.consequent) +
          ':' + visit(n.alternate) +
          ')',

    LogicalExpression: n =>
        '(' + visit(n.left) + n.operator + visit(n.right) + ')',

    ObjectExpression: n => {
      // If any keys would override Object prototype methods, throw error
      for (const prop of n.properties) {
        const keyName = prop.key.name;

        if (DisallowedObjectProperties.has(keyName)) {
          error('Illegal property: ' + keyName);
        }
      }

      return '{' + n.properties.map(visit).join(',') + '}';
    },

    Property: n => {
        memberDepth += 1;
        const k = visit(n.key);
        memberDepth -= 1;
        return k + ':' + visit(n.value);
      }
  };

  function codegen(ast) {
    const result = {
      code:    visit(ast),
      globals: Object.keys(globals),
      fields:  Object.keys(fields)
    };
    globals = {};
    fields = {};
    return result;
  }

  codegen.functions = functions;
  codegen.constants = constants;

  return codegen;
}
