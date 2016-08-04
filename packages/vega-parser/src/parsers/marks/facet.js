import parseSpec from '../spec';
import DataScope from '../../DataScope';
import {ref} from '../../util';
import {Collect, Facet, PreFacet} from '../../transforms';
import {error} from 'vega-util';

export default function(spec, scope) {
  var facet = spec.from.facet,
      name = facet.name,
      data = ref(scope.getData(facet.data).output),
      subscope, source, op;

  if (!facet.name) {
    error('Facet must have a name: ' + JSON.stringify(facet));
  }
  if (!facet.data) {
    error('Facet must reference a data set: ' + JSON.stringify(facet));
  }

  if (facet.field) {
    op = scope.add(PreFacet({
      field: scope.fieldRef(facet.field),
      pulse: data
    }));
  } else if (facet.key) {
    op = scope.add(Facet({
      key:   scope.keyRef(facet.key),
      pulse: data
    }));
  } else {
    error('Facet must specify a key or field: ' + JSON.stringify(facet));
  }

  // initialize facet subscope
  subscope = scope.fork();
  source = subscope.add(Collect());
  subscope.addData(name, new DataScope(subscope, source, source));

  // parse faceted subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}
