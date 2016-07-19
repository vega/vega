import {signalPrefix} from '../expression';
import {stringValue} from 'vega-util';

export default function(name, scope, params) {
  var signalName = signalPrefix + name;
  if (!params.hasOwnProperty(signalName)) {
    params[signalName] = scope.signalRef(name);
  }
  return '_[' + stringValue(signalName) + ']';
}
