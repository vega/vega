import {PreFacet, Sieve} from '../../transforms';

export default function(spec, scope, input) {
  const op = scope.add(PreFacet({pulse: input.pulse}, undefined, undefined, spec)),
        subscope = scope.fork();

  subscope.add(Sieve(undefined, undefined, undefined, spec));
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: subscope.parse(spec).toRuntime()
  };
}
