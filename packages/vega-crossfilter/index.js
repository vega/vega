import {register} from 'vega-dataflow';

import CrossFilter from './src/CrossFilter';
import CrossFilterDefinition from './definitions/CrossFilter';
register(CrossFilterDefinition, CrossFilter);

import ResolveFilter from './src/ResolveFilter';
import ResolveFilterDefinition from './definitions/ResolveFilter';
register(ResolveFilterDefinition, ResolveFilter);

export {transform, definition} from 'vega-dataflow';
