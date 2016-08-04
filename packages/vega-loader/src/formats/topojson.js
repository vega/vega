import json from './json';
import {feature, mesh} from 'topojson';
import {error} from 'vega-util';

export default function(data, format) {
  var object, property;
  data = json(data, format);

  if (format && (property = format.feature)) {
    return (object = data.objects[property])
      ? feature(data, object).features
      : error('Invalid TopoJSON object: ' + property);
  }

  else if (format && (property = format.mesh)) {
    return (object = data.objects[property])
      ? [mesh(data, object)]
      : error('Invalid TopoJSON object: ' + property);
  }

  error('Missing TopoJSON feature or mesh parameter.');
}
