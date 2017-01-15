import dataName from './data-name';
import parseTransform from '../transform';
import {ref} from '../../util';
import {Collect} from '../../transforms';
import {array, error, extend} from 'vega-util';

export default function(from, group, scope) {
  var facet, key, op, dataRef, parent;

  // if no source data, generate singleton datum
  if (!from) {
    dataRef = ref(scope.add(Collect(null, [{}])));
  }

  // if faceted, process facet specification
  else if (facet = from.facet) {
    if (!group) error('Only group marks can be faceted.');

    // use pre-faceted source data, if available
    if (facet.field != null) {
      dataRef = parent = ref(scope.getData(facet.data).output);
    } else {
      key = scope.keyRef(facet.groupby);

      // generate facet aggregates if no direct data specification
      if (!from.data) {
        op = parseTransform(extend({
          type:    'aggregate',
          groupby: array(facet.groupby)
        }, facet.aggregate));
        op.params.key = key;
        op.params.pulse = ref(scope.getData(facet.data).output);
        dataRef = parent = ref(scope.add(op));
      } else {
        parent = ref(scope.getData(from.data).aggregate);
      }
    }
  }

  // if not yet defined, get source data reference
  if (!dataRef) {
    dataRef = from.$ref ? from
      : from.mark ? ref(scope.getData(dataName(from.mark)).output)
      : ref(scope.getData(from.data).output);
  }

  return {
    key: key,
    pulse: dataRef,
    parent: parent
  };
}
