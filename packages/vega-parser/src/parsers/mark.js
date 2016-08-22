import definition from './marks/definition';
import dataName from './marks/data-name';
import parseData from './marks/data';
import parseFacet from './marks/facet';
import parseSubflow from './marks/subflow';
import getRole from './marks/role';
import {GroupMark} from './marks/marktypes';
import {FrameRole, MarkRole, ScopeRole} from './marks/roles';
import {encoders} from './encode/encode-util';
import parseTransform from './transform';
import parseTrigger from './trigger';
import parseSpec from './spec';
import DataScope from '../DataScope';
import {ref} from '../util';
import {error} from 'vega-util';
import {Bound, Collect, DataJoin, Mark, Encode, Render, Sieve, ViewLayout} from '../transforms';

export default function(spec, scope) {
  var role = getRole(spec),
      group = spec.type === GroupMark,
      facet = spec.from && spec.from.facet,
      layout = role === ScopeRole || role === FrameRole,
      op, input, store, bound, render, sieve, name,
      markRef, encodeRef, boundRef;

  // resolve input data
  input = parseData(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(DataJoin(input));

  // collect visual items
  op = store = scope.add(Collect({pulse: ref(op)}));

  // connect visual items to scenegraph
  op = scope.add(Mark({
    markdef:   definition(spec),
    scenepath: {$itempath: scope.markpath()},
    pulse:     ref(op)
  }));
  markRef = ref(op);

  // add visual encoders
  op = scope.add(Encode(
    encoders(spec.encode, spec.type, role, scope, {pulse: markRef})
  ));

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

  // if group is faceted or requires view layout, recurse here
  if (facet || layout) {
    op = scope.add(ViewLayout({
      legendMargin: scope.config.legendMargin,
      mark:         markRef,
      pulse:        encodeRef
    }));

    // we juggle the layout operator as we want it in our scope state,
    // but we also want it to be run *after* any faceting transforms
    scope.operators.pop();
    scope.pushState(encodeRef, ref(op));
    (facet ? parseFacet(spec, scope) : parseSubflow(spec, scope, input));
    scope.popState();
    scope.operators.push(op);
  }

  // compute bounding boxes
  bound = scope.add(Bound({mark: markRef, pulse: ref(op)}));
  boundRef = ref(bound);

  // if non-faceted / non-layout group, recurse here
  if (group && !facet && !layout) {
    scope.pushState(encodeRef, boundRef);
    // if a normal group mark, we must generate dynamic subflows
    // otherwise, we know the group is a guide with only one group item
    // in that case we can simplify the dataflow
    (role === MarkRole ? parseSubflow(spec, scope, input) : parseSpec(spec, scope));
    scope.popState();
  }

  // render / sieve items
  render = scope.add(Render({pulse: boundRef}));
  sieve = scope.add(Sieve({pulse: boundRef}, undefined, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  // add trigger updates if defined
  if (spec.name != null) {
    name = dataName(spec.name);
    scope.addData(name, new DataScope(scope, store, render, sieve));
    if (spec.on) spec.on.forEach(function(on) {
      if (on.insert || on.remove || on.toggle) {
        error('Marks only support modify triggers.');
      }
      parseTrigger(on, scope, name);
    });
  }
}
