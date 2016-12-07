import {transform} from 'vega-dataflow';

import Bound from './src/transforms/Bound';
import Mark from './src/transforms/Mark';
import Render from './src/transforms/Render';
import ViewLayout from './src/transforms/ViewLayout';

transform('Bound', Bound);
transform('Mark', Mark);
transform('Render', Render);
transform('ViewLayout', ViewLayout);

export {default as View} from './src/view/View';
