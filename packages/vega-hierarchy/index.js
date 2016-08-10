import {register} from 'vega-dataflow';

import Nest from './src/Nest';
import Stratify from './src/Stratify';
import TreeLinks from './src/TreeLinks';
import {Pack, Partition, Tree, Treemap} from './src/Layouts';

import NestDefinition from './definitions/Nest';
import StratifyDefinition from './definitions/Stratify';
import TreeLinksDefinition from './definitions/TreeLinks';
import PackDefinition from './definitions/Pack';
import PartitionDefinition from './definitions/Partition';
import TreeDefinition from './definitions/Tree';
import TreemapDefinition from './definitions/Treemap';

register(NestDefinition, Nest);
register(StratifyDefinition, Stratify);
register(TreeLinksDefinition, TreeLinks);
register(PackDefinition, Pack);
register(PartitionDefinition, Partition);
register(TreeDefinition, Tree);
register(TreemapDefinition, Treemap);

export {transform, definition} from 'vega-dataflow';
