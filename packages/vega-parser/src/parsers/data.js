import parseTransform from './transform';
import parseTrigger from './trigger';
import {hasSignal, ref} from '../util';
import {Collect, Load, Relay, Sieve} from '../transforms';
import {array} from 'vega-util';

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
    output.push(source = collect({
      $ingest: data.values,
      $format: data.format
    }));
  } else if (data.url) {
    // load data from external source
    // if either url or format has signal, use dynamic loader
    // otherwise, request load upon dataflow init
    source = (hasSignal(data.url) || hasSignal(data.format))
      ? {$load: ref(scope.add(load(scope, data, source)))}
      : {$request: data.url, $format: data.format};
    output.push(source = collect(source));
  } else if (data.source) {
    // derives from one or more other data sets
    source = upstream = array(data.source).map(function(d) {
      return ref(scope.getData(d).output);
    });
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
    n = upstream.length - 1;
    output[0] = Relay({
      derive: modify,
      pulse: n ? upstream : upstream[0]
    });
    if (modify || n) {
      // collect derived and multi-pulse tuples
      output.splice(1, 0, collect());
    }
  }

  if (!source) output.push(collect());
  output.push(Sieve({}));
  return output;
}

function collect(values) {
  var s = Collect({}, values);
  s.metadata = {source: true};
  return s;
}

function load(scope, data) {
  return Load({
    url:    scope.property(data.url),
    format: scope.objectProperty(data.format)
  });
}
