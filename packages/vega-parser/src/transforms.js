import {entry} from './util';

function transform(name) {
  return function(params, value, parent) {
    return entry(name, value, params || undefined, parent);
  };
}

export var Aggregate = transform('Aggregate');
export var AxisTicks = transform('AxisTicks');
export var Bound = transform('Bound');
export var Collect = transform('Collect');
export var Compare = transform('Compare');
export var DataJoin = transform('DataJoin');
export var Encode = transform('Encode');
export var Extent = transform('Extent');
export var Facet = transform('Facet');
export var Field = transform('Field');
export var Key = transform('Key');
export var LegendEntries = transform('LegendEntries');
export var Mark = transform('Mark');
export var MultiExtent = transform('MultiExtent');
export var MultiValues = transform('MultiValues');
export var Params = transform('Params');
export var PreFacet = transform('PreFacet');
export var Projection = transform('Projection');
export var Proxy = transform('Proxy');
export var Relay = transform('Relay');
export var Render = transform('Render');
export var Scale = transform('Scale');
export var Sieve = transform('Sieve');
export var ViewLayout = transform('ViewLayout');
export var Values = transform('Values');
