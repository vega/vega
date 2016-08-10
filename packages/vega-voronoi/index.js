import {register} from 'vega-dataflow';

import Voronoi from './src/Voronoi';
import VoronoiDefinition from './definitions/Voronoi';
register(VoronoiDefinition, Voronoi);

export {transform, definition} from 'vega-dataflow';
