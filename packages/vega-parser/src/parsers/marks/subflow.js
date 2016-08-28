import parseSpec from '../spec';
import {Sieve, PreFacet} from '../../transforms';

export default function(spec, scope, input) {
  var op = scope.add(PreFacet({pulse: input.pulse})),
      subscope = scope.fork();

  subscope.add(Sieve());
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}
