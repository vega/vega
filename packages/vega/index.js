// -- Transforms -----

import {extend} from 'vega-util';
import {transforms} from 'vega-dataflow';
import * as tx from 'vega-transforms';
import * as vtx from 'vega-view-transforms';
import * as encode from 'vega-encode';
import * as geo from 'vega-geo';
import * as force from 'vega-force';
import * as tree from 'vega-hierarchy';
import * as label from 'vega-label';
import * as reg from 'vega-regression';
import * as voronoi from 'vega-voronoi';
import * as wordcloud from 'vega-wordcloud';
import * as xf from 'vega-crossfilter';
extend(
  transforms,
  tx, vtx, encode, geo, force, label, tree, reg, voronoi, wordcloud, xf
);

export * from './base.js';
