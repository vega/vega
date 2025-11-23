import {transforms} from '@omni-co/vega-dataflow';
import {functionContext} from '@omni-co/vega-functions';
import {context} from '@omni-co/vega-runtime';

export default function(view, spec, expr) {
  return context(view, transforms, functionContext, expr).parse(spec);
}
