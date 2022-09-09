import {getDataRef} from './data';
import DataScope from '../../DataScope';
import {Collect, Facet, PreFacet, Sieve} from '../../transforms';
import {ref} from '../../util';
import {error, stringValue} from 'vega-util';

export default function(spec, scope, group) {
  const facet = spec.from.facet,
        name = facet.name,
        data = getDataRef(facet, scope);
  let op;

  if (!facet.name) {
    error('Facet must have a name: ' + stringValue(facet));
  }
  if (!facet.data) {
    error('Facet must reference a data set: ' + stringValue(facet));
  }

  if (facet.field) {
    op = scope.add(PreFacet({
      field: scope.fieldRef(facet.field, undefined, spec),
      pulse: data
    }, undefined, undefined, spec));
  } else if (facet.groupby) {
    op = scope.add(Facet({
      key:   scope.keyRef(facet.groupby, undefined, spec),
      group: ref(scope.proxy(group.parent, spec)),
      pulse: data
    }, undefined, undefined, spec));
  } else {
    error('Facet must specify groupby or field: ' + stringValue(facet));
  }

  // initialize facet subscope
  const subscope = scope.fork(),
        source = subscope.add(Collect(undefined, undefined, undefined, spec)),
        values = subscope.add(Sieve({pulse: ref(source)}, undefined, undefined, spec));
  subscope.addData(name, new DataScope(subscope, source, source, values));
  subscope.addSignal('parent', null, spec);

  // parse faceted subflow
  op.params.subflow = {
    $subflow: subscope.parse(spec).toRuntime()
  };
}
