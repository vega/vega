import * as transforms from '../transforms/index';

import {
  parse,
  context
} from 'vega-runtime';

import {
  rgb,
  lab,
  hcl,
  hsl
} from 'd3-color';

var encode = {
  rgb: rgb,
  lab: lab,
  hcl: hcl,
  hsl: hsl
};

export default function(dataflow, spec) {
  return parse(spec, context(dataflow, transforms, encode));
}
