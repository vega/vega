import {parse, codegen, functions, constants} from 'vega-expression';
import {stringValue} from 'vega-util';

export var signalPrefix = '$';
export var scalePrefix  = '%';

export var generator = codegen({
  whitelist:  ['datum', 'event'],
  fieldvar:   'datum',
  globalvar:  signal,
  functions:  functions,
  constants:  constants
});

function signal(id) {
  return '_[' + stringValue('$' + id) + ']';
}

export default function(expr/*, scope*/) {
  var e = generator(parse(expr));

  // TODO: collect data references, scale references
  return {
    $expr:   e.code,
    $fields: e.fields,
    $params: e.globals
  };
}
