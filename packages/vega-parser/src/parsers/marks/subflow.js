import parseSpec from '../spec';
import {ref} from '../../util';
import {Sieve, PreFacet} from '../../transforms';

export default function(spec, scope) {
  var data = ref(scope.getData(spec.from.data).output),
      op = scope.add(PreFacet({pulse: data})),
      subscope = scope.fork();

  subscope.add(Sieve());

  // parse faceted subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}
