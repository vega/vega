import {
  parse,
  codegen,
  functions as baseFunctions,
  constants
} from 'vega-expression';
import {stringValue} from 'vega-util';

export var signalPrefix = '$';
export var scalePrefix  = '%';
export var dataPrefix   = '@';
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

  // to support hyperlinks
  fn.open  = 'window.open';

  return fn;
}

function signal(id) {
  return '_[' + stringValue('$' + id) + ']';
}

export default function(expr, scope, preamble) {
  // TODO cache?
  var e = generator(parse(expr));

  var code = preamble
    ? preamble + 'return(' + e.code + ');'
    : e.code;

  // TODO: collect data references, scale references
  return {
    $expr:   code,
    $fields: e.fields,
    $params: e.globals
  };
}
