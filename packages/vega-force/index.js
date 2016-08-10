import {register} from 'vega-dataflow';

import Force from './src/Force';
import ForceDefinition from './definitions/Force';
register(ForceDefinition, Force);

export {transform, definition} from 'vega-dataflow';
