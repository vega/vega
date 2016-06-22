import parseEncode from './encode';
import {ref, transform} from '../util';

export default function parseMark(mark, scope) {
  // TODO: facet? transforms?
  var data = scope.getData(mark.from.data),
      op, key, params, enc;

  // add data join to map tuples to visual items
  op = scope.add(transform('DataJoin', {
    key:   mark.key ? scope.fieldRef(mark.key) : undefined,
    item:  {$item: mark.type, $name: mark.name},
    pulse: data.output
  }));

  // collect visual items, sort as requested
  // TODO: collected array should be part of scenegraph
  op = scope.add(transform('Collect', {
    sort:  mark.sort ? scope.compareRef(mark.sort) : undefined,
    pulse: ref(op)
  }));

  // parse encoders if defined
  if (mark.encode) {
    enc = {};
    params = {encoders: {$encode: enc}};
    for (key in mark.encode) {
      enc[key] = parseEncode(mark.encode[key], params, scope);
    }
    params.pulse = ref(op);
    op = scope.add(transform('Encode', params));
  }

  // TODO: post-processing, bounds calculations
}
