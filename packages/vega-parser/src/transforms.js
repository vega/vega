import {entry} from './util.js';

const transform = name => (params, value, parent) =>
  entry(name, value, params || undefined, parent);

export const Aggregate = transform('aggregate');
export const AxisTicks = transform('axisticks');
export const Bound = transform('bound');
export const Collect = transform('collect');
export const Compare = transform('compare');
export const DataJoin = transform('datajoin');
export const Encode = transform('encode');
export const Expression = transform('expression');
export const Extent = transform('extent');
export const Facet = transform('facet');
export const Field = transform('field');
export const Key = transform('key');
export const LegendEntries = transform('legendentries');
export const Load = transform('load');
export const Mark = transform('mark');
export const MultiExtent = transform('multiextent');
export const MultiValues = transform('multivalues');
export const Overlap = transform('overlap');
export const Params = transform('params');
export const PreFacet = transform('prefacet');
export const Projection = transform('projection');
export const Proxy = transform('proxy');
export const Relay = transform('relay');
export const Render = transform('render');
export const Scale = transform('scale');
export const Sieve = transform('sieve');
export const SortItems = transform('sortitems');
export const ViewLayout = transform('viewlayout');
export const Values = transform('values');
