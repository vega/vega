import definition from './marks/definition';
import dataName from './marks/data-name';
import parseData from './marks/data';
import parseFacet from './marks/facet';
import role from './marks/role';
import {Group} from './marks/marktypes';
import {ScopeRole} from './marks/roles';
import parseEncode from './encode';
import parseTransform from './transform';
import parseSpec from './spec';
import DataScope from '../DataScope';
import {ref} from '../util';
import {error} from 'vega-util';
import {Bound, Collect, DataJoin, Mark, Encode, Render, Sieve, ViewLayout} from '../transforms';

export default function(spec, scope) {
  var facet = spec.from && spec.from.facet,
      group = spec.type === Group,
      input, key, op, params, enc,
      markRef, encodeRef, boundRef,
      bound, render, sieve;

  // resolve input data
  input = parseData(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(DataJoin(input));

  // collect visual items
  op = scope.add(Collect({pulse: ref(op)}));

  // connect visual items to scenegraph
  op = scope.add(Mark({
    markdef:   definition(spec),
    scenepath: {$itempath: scope.markpath()},
    pulse:     ref(op)
  }));
  markRef = ref(op);

  // add visual encoders
  params = {encoders: {$encode: (enc={})}, pulse: markRef};
  for (key in spec.encode) {
    enc[key] = parseEncode(spec.encode[key], spec.type, params, scope);
  }
  op = scope.add(Encode(params));

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
    op = scope.add(ViewLayout({
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
  bound = scope.add(Bound({mark: markRef, pulse: ref(op)}));
  boundRef = ref(bound);

  // if non-faceted group, recurse directly
  if (group && !facet) {
    scope.pushState(encodeRef, boundRef);
    parseSpec(spec, role(spec) === ScopeRole ? scope.fork() : scope);
    scope.popState();
  }

  // render / sieve items
  render = scope.add(Render({pulse: boundRef}));
  sieve = scope.add(Sieve({pulse: boundRef}, undefined, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  if (spec.name != null) {
    scope.addData(dataName(spec.name), new DataScope(scope, null, render, sieve))
  }
}
