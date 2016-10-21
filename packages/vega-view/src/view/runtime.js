import {transforms} from 'vega-dataflow';
import {functionContext} from 'vega-parser';
import {parse, context} from 'vega-runtime';

export default function(view, spec, functions) {
  return parse(spec, context(view, transforms, functions || functionContext));
}
