import {error, stringValue} from 'vega-util';

const OUTER = 'outer',
      OUTER_INVALID = ['value', 'update', 'init', 'react', 'bind'];

function outerError(prefix, name) {
  error(prefix + ' for "outer" push: ' + stringValue(name));
}

export default function(signal, scope) {
  const name = signal.name;

  if (signal.push === OUTER) {
    // signal must already be defined, raise error if not
    if (!scope.signals[name]) outerError('No prior signal definition', name);
    // signal push must not use properties reserved for standard definition
    OUTER_INVALID.forEach(prop => {
      if (signal[prop] !== undefined) outerError('Invalid property ', prop);
    });
  } else {
    // define a new signal in the current scope
    const op = scope.addSignal(name, signal.value);
    if (signal.react === false) op.react = false;
    if (signal.bind) scope.addBinding(name, signal.bind);
  }
}
