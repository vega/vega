import {register, transform} from 'vega-dataflow';

import Contour from './src/Contour';
import GeoPath from './src/GeoPath';
import GeoPoint from './src/GeoPoint';
import GeoShape from './src/GeoShape';
import Graticule from './src/Graticule';
import Projection from './src/Projection';

import ContourDefinition from './definitions/Contour';
import GeoPathDefinition from './definitions/GeoPath';
import GeoPointDefinition from './definitions/GeoPoint';
import GeoShapeDefinition from './definitions/GeoShape';
import GraticuleDefinition from './definitions/Graticule';

register(ContourDefinition, Contour);
register(GeoPathDefinition, GeoPath);
register(GeoPointDefinition, GeoPoint);
register(GeoShapeDefinition, GeoShape);
register(GraticuleDefinition, Graticule);

transform('Projection', Projection);

export {transform, definition} from 'vega-dataflow';

export {projection} from './src/projections';
