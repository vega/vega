import parseEncode from './encode';
import parseTransform from './transform';
import {ref, transform} from '../util';
import {error} from 'vega-util';

// TODO: facet, pre/post-transforms, reactive geometry
export default function parseMark(mark, scope) {
  var op, markRef, boundRef, key, params, enc, children;

  // add data join to map tuples to visual items
  op = scope.add(transform('DataJoin', {
    key:   mark.key ? scope.fieldRef(mark.key) : undefined,
    pulse: mark.from.$ref ? mark.from
            : ref(scope.getData(mark.from.data).output)
  }));

  // collect visual items, sort as requested
  op = scope.add(transform('Collect', {
    sort:  mark.sort ? scope.compareRef(mark.sort) : undefined,
    pulse: ref(op)
  }));

  // connect visual items to scenegraph
  markRef = ref(op = scope.add(transform('Mark', {
    markdef:   markDefinition(mark),
    scenepath: scope.scenepathNext(),
    pulse:     ref(op)
  })));

  // add visual encoders (if defined)
  if (mark.encode) {
    enc = {};
    params = {encoders: {$encode: enc}};
    for (key in mark.encode) {
      enc[key] = parseEncode(mark.encode[key], mark.type, params, scope);
    }
    params.pulse = markRef;
    op = scope.add(transform('Encode', params));
  }

  // post-encoding transforms
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

  // recurse if group mark
  if (mark.type === 'group') {
    scope.scenepathPush();
    children = mark.marks.map(function(child) {
      return parseMark(child, scope);
    });
    scope.scenepathPop();
  }

  // compute bounding boxes
  boundRef = ref(scope.add(transform('Bound', {
    mark: markRef,
    pulse: ref(op),
    children: children
  })));

  // render marks
  scope.add(transform('Render', {pulse: boundRef}));

  // propagate value changes
  return ref(scope.add(transform('Sieve', {pulse: boundRef})));
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
