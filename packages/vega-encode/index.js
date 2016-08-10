import {register, transform} from 'vega-dataflow';

import AxisTicks from './src/AxisTicks';
import DataJoin from './src/DataJoin';
import Encode from './src/Encode';
import LegendEntries from './src/LegendEntries';
import LinkPath from './src/LinkPath';
import Pie from './src/Pie';
import Scale from './src/Scale';
import Stack from './src/Stack';

import LinkPathDefinition from './definitions/LinkPath';
import PieDefinition from './definitions/Pie';
import StackDefinition from './definitions/Stack';

register(LinkPathDefinition, LinkPath);
register(PieDefinition, Pie);
register(StackDefinition, Stack);

transform('AxisTicks', AxisTicks);
transform('DataJoin', DataJoin);
transform('Encode', Encode);
transform('LegendEntries', LegendEntries);
transform('Scale', Scale);

export {transform, definition} from 'vega-dataflow';
export {scale, scheme} from 'vega-scale';
