import {transforms} from 'vega-dataflow';
import {functionContext} from 'vega-functions';
import {context, parse} from 'vega-runtime';

export default function(view, spec, functions) {
  var fn = functions || functionContext;
  return parse(spec, context(view, transforms, fn));
}
