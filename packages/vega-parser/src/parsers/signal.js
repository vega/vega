import {error} from 'vega-util';

export default function(signal, scope) {
  var name = signal.name;

  if (signal.outer) {
    // signal must already be defined, raise error if not
    if (!scope.signals[name]) {
      error('Missing prior signal definition for "outer": ' + name);
    }
  } else {
    // define a new signal in the current scope
    var op = scope.addSignal(name, signal.value);
    if (signal.react === false) op.react = false;
    if (signal.bind) scope.addBinding(name, signal.bind);
  }
}
