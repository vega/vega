import json from './json';
import {feature, mesh} from 'topojson-client';
import {error} from 'vega-util';

export default function(data, format) {
  var method, object, property;
  data = json(data, format);

  method = (format && (property = format.feature)) ? feature
    : (format && (property = format.mesh)) ? mesh
    : error('Missing TopoJSON feature or mesh parameter.');

  object = (object = data.objects[property])
    ? method(data, object)
    : error('Invalid TopoJSON object: ' + property);

  return object && object.features || [object];
}
