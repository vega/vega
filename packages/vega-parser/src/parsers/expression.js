import {
  parse,
  codegen,
  functions as baseFunctions,
  constants
} from 'vega-expression';
import {error, stringValue} from 'vega-util';

export var signalPrefix = '$';
export var scalePrefix  = '%';
export var indexPrefix  = '@';
export var eventPrefix  = 'event.vega.';

export var generator = codegen({
  blacklist:  ['_'],
  whitelist:  ['datum', 'event'],
  fieldvar:   'datum',
  globalvar:  signal,
  functions:  functions,
  constants:  constants
});

export var functions = function(codegen) {
  var fn = baseFunctions(codegen);

  // view-specific event information
  fn.view  = eventPrefix + 'view';
  fn.item  = eventPrefix + 'item';
  fn.group = eventPrefix + 'group';
  fn.xy    = eventPrefix + 'xy';
  fn.x     = eventPrefix + 'x';
  fn.y     = eventPrefix + 'y';

  // hyperlink support
  fn.open  = 'window.open';

  // color functions
  fn.rgb = 'this.rgb';
  fn.lab = 'this.lab';
  fn.hcl = 'this.hcl';
  fn.hsl = 'this.hsl';

  // scales, projections, data
  fn.scale  = 'this.scale';
  fn.invert = 'this.scaleInvert';
  fn.copy   = 'this.scaleCopy';
  fn.indata = 'this.indata';

  return fn;
}

function signal(id) {
  return '_[' + stringValue('$' + id) + ']';
}

function scale(name, scope, params) {
  var scaleName = scalePrefix + name;
  if (!params.hasOwnProperty(scaleName)) {
    params[scaleName] = scope.scaleRef(name);
  }
}

function index(data, field, scope, params) {
  var indexName = indexPrefix + field;
  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(field);
  }
}

export default function(expr, scope, preamble) {
  var ast = parse(expr),
      gen = generator(ast),
      code = preamble ? preamble + 'return(' + gen.code + ');' : gen.code,
      params = gen.globals,
      fields = gen.fields;

  ast.visit(function visitor(node) {
    if (node.type !== 'CallExpression') return;

    var name = node.callee.name,
        args = node.arguments;

    switch (node.callee.name) {
      case 'scale':
      case 'invert':
        if (args[0].type !== 'Literal') {
          error('First argument to ' + name + ' must be a string literal.');
        }
        scale(args[0], scope, params);
        break;
      case 'copy':
        if (args[0].type !== 'Literal' || args[1].type !== 'Literal') {
          error('Arguments to copy must be string literals.');
        }
        scale(args[0], scope, params);
        scale(args[1], scope, params);
        break;
      case 'indata':
        if (args[0].type !== 'Literal') {
          error('First argument to indata must be a string literal.');
        }
        if (args[1].type !== 'Literal') {
          error('Second argument to indata must be a string literal.');
        }
        index(args[0], args[1], scope, params);
        break;
    }
  });

  return {
    $expr:   code,
    $fields: fields,
    $params: params
  };
}
