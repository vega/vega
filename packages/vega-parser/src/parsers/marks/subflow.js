import {PreFacet, Sieve} from '../../transforms.js';

export default function(spec, scope, input) {
  const op = scope.add(PreFacet({pulse: input.pulse})),
        subscope = scope.fork();

  subscope.add(Sieve());
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: subscope.parse(spec).toRuntime()
  };
}
