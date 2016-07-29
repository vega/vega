import parseEncode from './encode';
import parseFacet from './facet';
import parseTransform from './transform';
import {ref, transform} from '../util';
import {error} from 'vega-util';

// TODO: reactive geometry
export default function parseMark(spec, scope) {
  var from = spec.from,
      facet = from.facet,
      group = spec.type === 'group',
      key, op, dataRef, markRef, encodeRef, params, enc;

  // resolve input data
  if (facet = from.facet) {
    if (!group) error('Only group marks can be faceted.');

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
  op = scope.add(transform('Mark', {
    markdef:   markDefinition(spec),
    scenepath: {$itempath: scope.markpath()},
    pulse:     ref(op)
  }));
  markRef = ref(op);

  // add visual encoders
  params = {encoders: {$encode: (enc={})}, pulse: markRef};
  for (key in spec.encode) {
    enc[key] = parseEncode(spec.encode[key], spec.type, params, scope);
  }
  op = scope.add(transform('Encode', params));

  // add post-encoding transforms, if defined
  if (spec.transform) {
    spec.transform.forEach(function(_) {
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

  // if faceted, add layout and recurse
  if (facet) {
    op = scope.add(transform('ChartLayout', {
      legendMargin: scope.config.legendMargin,
      mark:         markRef,
      pulse:        encodeRef
    }));

    scope.operators.pop();
    scope.pushState(encodeRef, ref(op));
    parseFacet(spec, scope);
    scope.popState();
    scope.operators.push(op);
  }

  // compute bounding boxes
  op = scope.add(transform('Bound', {mark: markRef, pulse: ref(op)}));

  // if non-faceted group, recurse directly
  if (group && !facet) {
    scope.pushState(encodeRef, ref(op));
    spec.marks.map(function(_) { return parseMark(_, scope); });
    scope.popState();
  }

  // render / sieve items
  scope.add(transform('Render', {pulse: ref(op)}));
  scope.add(transform('Sieve', {pulse: ref(op)}, scope.parent()));
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
