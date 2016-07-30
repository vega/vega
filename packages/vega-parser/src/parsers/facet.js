import parsePadding from './padding';
import parseSpec from './spec';
import {ref, transform} from '../util';
import DataScope from '../DataScope';
import {error} from 'vega-util';

export default function(spec, scope) {
  var facet = spec.from.facet,
      name = facet.name,
      subscope, source, op;

  if (!facet.name) {
    error('Facet must have a name: ' + JSON.stringify(facet));
  }
  if (!facet.data) {
    error('Facet must reference a data set: ' + JSON.stringify(facet));
  }
  if (!(facet.key || facet.field)) {
    error('Facet must specify a key or field: ' + JSON.stringify(facet));
  }

  // TODO: facet field for pre-faceted data
  op = scope.add(transform('Facet', {
    key:    scope.keyRef(facet.key),
    pulse:  ref(scope.getData(facet.data).output)
  }));

  // initialize subscope
  subscope = scope.fork();
  source = subscope.add(transform('Collect'));
  subscope.addData(name, new DataScope(subscope, source, source));

  subscope.addSignal('width', spec.width || -1);
  subscope.addSignal('height', spec.height || -1);
  subscope.addSignal('padding', parsePadding(spec.padding));

  // parse faceted subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}
