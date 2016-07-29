import parseEncode from './encode';
import parseFacet from './facet';
import parseTransform from './transform';
import {ref, transform} from '../util';
import {error} from 'vega-util';

// TODO: reactive geometry
export default function parseMark(mark, scope) {
  var from = mark.from, facet, key,
      op, dataRef, markRef, encodeRef, boundRef, params, enc;

  // resolve input data
  if (facet = from.facet) {
    // TODO: support more aggregate options
    key = scope.fieldRef(facet.key);
    dataRef = ref(scope.add(transform('Aggregate', {
      groupby: key,
      pulse:   ref(scope.getData(facet.data).output)
    })));
  } else {
    dataRef = from.$ref
      ? from
      : ref(scope.getData(from.data).output);
    key = from.key ? scope.fieldRef(from.key) : undefined;
  }

  // add data join to map tuples to visual items
  op = scope.add(transform('DataJoin', {key: key, pulse: dataRef}));

  // collect visual items
  op = scope.add(transform('Collect', {pulse: ref(op)}));

  // connect visual items to scenegraph
  markRef = ref(op = scope.add(transform('Mark', {
    markdef:   markDefinition(mark),
    scenepath: {$itempath: scope.markpath()},
    pulse:     ref(op)
  })));

  // add visual encoders
  params = {encoders: {$encode: (enc={})}, pulse: markRef};
  for (key in mark.encode) {
    enc[key] = parseEncode(mark.encode[key], mark.type, params, scope);
  }
  op = scope.add(transform('Encode', params));

  // add post-encoding transforms, if defined
  if (mark.transform) {
    mark.transform.forEach(function(_) {
      var tx = parseTransform(_, scope);
      if (tx.metadata.generates) {
        error('Mark transforms should not generate new data.');
      }
      tx.params.pulse = ref(op);
      scope.add(op = tx);
    });
  }

  // monitor parent marks to propagate changes
  op.params.parent = scope.encode();
  encodeRef = ref(op);

  // TODO: if faceted, include chart layout

  // compute bounding boxes
  op = scope.add(transform('Bound', {mark: markRef, pulse: encodeRef}));
  boundRef = ref(op);

  // recurse if group mark
  if (mark.type === 'group') {
    scope.pushState(encodeRef, boundRef);

    facet
      ? parseFacet(mark, scope)
      : mark.marks.map(function(_) { return parseMark(_, scope); });

    scope.popState();
  }

  // render marks
  scope.add(transform('Render', {pulse: boundRef}));

  // propagate value changes
  ref(scope.add(transform('Sieve', {pulse: boundRef}, scope.parent())));
}

function markDefinition(spec) {
  return {
    clip:        spec.clip || false,
    interactive: spec.interactive === false ? false : true,
    marktype:    spec.type,
    name:        spec.name || undefined,
    role:        spec.role || undefined
  };
}
