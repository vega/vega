import parseTransform from './transform';
import parseTrigger from './trigger';
import {ref} from '../util';
import {Collect, Relay, Sieve} from '../transforms';

export default function parseData(data, scope) {
  var transforms = [];

  if (data.transform) {
    data.transform.forEach(function(tx) {
      transforms.push(parseTransform(tx, scope));
    });
  }

  if (data.on) {
    data.on.forEach(function(on) {
      parseTrigger(on, scope, data.name);
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
    output.push(source = collect({$ingest: data.values, $format: data.format}));
  } else if (data.url) {
    // load data from external source
    output.push(source = collect({$request: data.url, $format: data.format}));
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
    output[0] = Relay({derive: modify, pulse: ref(upstream.output)});
    if (modify) output.splice(1, 0, collect()); // collect derived tuples
  }

  if (!source) output.push(collect());
  output.push(Sieve({}));
  return output;
}

function collect(values) {
  var s = Collect({}, values);
  return s.metadata = {source: true}, s;
}
