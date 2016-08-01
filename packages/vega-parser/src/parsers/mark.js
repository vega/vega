import parseEncode from './encode';
import parseFacet from './facet';
import parseTransform from './transform';
import DataScope from '../DataScope';
import {entry, ref, transform} from '../util';
import {array, error, extend} from 'vega-util';

// TODO: reactive geometry
export default function parseMark(spec, scope) {
  var facet = spec.from && spec.from.facet,
      group = spec.type === 'group',
      input, key, op, params, enc,
      markRef, encodeRef, boundRef,
      bound, render, sieve;

  // resolve input data
  input = markData(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(transform('DataJoin', input));

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
  bound = scope.add(transform('Bound', {mark: markRef, pulse: ref(op)}));
  boundRef = ref(bound);

  // if non-faceted group, recurse directly
  if (group && !facet) {
    scope.pushState(encodeRef, boundRef);
    spec.marks.map(function(_) { return parseMark(_, scope); });
    scope.popState();
  }

  // render / sieve items
  render = scope.add(transform('Render', {pulse: boundRef}));
  sieve = scope.add(transform('Sieve', {pulse: boundRef}, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  if (spec.name != null) {
    scope.addData('mark:' + spec.name, new DataScope(scope, null, render, sieve))
  }
}

function markData(from, group, scope) {
  var facet, key, op, dataRef;

  // resolve input data
  if (!from) {
    // if no source data, generate singleton datum
    dataRef = ref(scope.add(entry('Collect', [{}])));
  } else if (facet = from.facet) {
    if (!group) error('Only group marks can be faceted.');

    if (facet.field != null) {
      // use pre-faceted source data
      dataRef = ref(scope.getData(facet.data).output);
    } else {
      // facet the source data
      op = parseTransform(extend({
        type:    'aggregate',
        groupby: array(facet.key)
      }, facet.aggregate));
      op.params.key = (key = scope.keyRef(facet.key));
      op.params.pulse = ref(scope.getData(facet.data).output);
      dataRef = ref(scope.add(op));
    }

  } else {
    // get output reference of source data set
    dataRef = from.$ref ? from
      : from.mark ? ref(scope.getData('mark:' + from.mark).output)
      : ref(scope.getData(from.data).output);
    key = from.key ? scope.fieldRef(from.key) : undefined;
  }

  return {key: key, pulse: dataRef};
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
