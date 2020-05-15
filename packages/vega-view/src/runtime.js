import {transforms} from 'vega-dataflow';
import {functionContext} from 'vega-functions';
import {context} from 'vega-runtime';

export default function(view, spec, functions) {
  const fn = functions || functionContext;
  return context(view, transforms, fn).parse(spec);
}
