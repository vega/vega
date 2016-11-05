import {transforms} from 'vega-dataflow';
import {functionContext} from 'vega-parser';
import {parse, context} from 'vega-runtime';
import {extend} from 'vega-util';

export default function(view, spec, functions) {
  var fn = functions || functionContext;
  return parse(spec, context(view, transforms, fn));
}
