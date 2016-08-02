import parseTransform from './transform';
import {entry, ref, transform} from '../util';
import {error} from 'vega-util';

export default function parseData(data, scope) {
  var transforms = [];

  if (data.transform) {
    data.transform.forEach(function(tx) {
      transforms.push(parseTransform(tx, scope));
    });
  }

  scope.addDataPipeline(data.name, analyze(data, scope, transforms));
}

/**
 * Analyze a data pipeline, add needed operators.
 */
function analyze(data, scope, ops) {
  // POSSIBLE TODOs:
  // - error checking for treesource on tree operators (BUT what if tree is upstream?)
  // - this is local analysis, perhaps some tasks better for global analysis...

  var output = [],
      source = null,
      modify = false,
      generate = false,
      upstream, i, n, t, m;

  if (data.values) {
    // hard-wired input data set
    output.push(source = collect(data.values));
  } else if (data.url) {
    // load data from external source
    // TODO: is loader a source?
    output.push(source = load(data));
  } else if (data.source) {
    // derives from another data set
    upstream = scope.getData(data.source);
    source = upstream.output;
    output.push(null); // populate later
  }

  // scan data transforms, add collectors as needed
  for (i=0, n=ops.length; i<n; ++i) {
    t = ops[i];
    m = t.metadata;

    if (!source && !m.source) {
      output.push(source = collect());
    }
    output.push(t);

    if (m.generates) generate = true;
    if (m.modifies && !generate) modify = true;

    if (m.source) source = t;
    else if (m.changes) source = null;
  }

  if (upstream) {
    if (modify) { // relay if we modify upstream tuples
      output[0] = collect();
      output.unshift(transform('Relay', {pulse: ref(upstream.output)}));
    } else {
      output[0] = transform('NoOp', {pulse: ref(upstream.output)});
    }
  }

  if (!source) output.push(collect());
  output.push(transform('Sieve', {}));
  return output;
}

function collect(values) {
  var s = entry('Collect', values, {});
  return s.metadata = {source: true}, s;
}

function load(/*data*/) {
  // TODO: add load operator
  error('Load data from URL not yet supported.');
}
