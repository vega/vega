import {inferTypes, typeParsers} from './type';
import {formats} from './formats/index';
import {error} from 'vega-util';
import {timeParse, utcParse} from 'd3-time-format';

export default function(data, schema, dateParse) {
  schema = schema || {};

  var reader = formats(schema.type || 'json');
  if (!reader) error('Unknown data format type: ' + schema.type);

  data = reader(data, schema);
  if (schema.parse) parse(data, schema.parse, dateParse);

  if (data.hasOwnProperty('columns')) delete data.columns;
  return data;
}

function parse(data, types, dateParse) {
  if (!data.length) return; // early exit for empty data

  dateParse = dateParse || timeParse;

  var fields = data.columns || Object.keys(data[0]),
      parsers, datum, field, i, j, n, m;

  if (types === 'auto') types = inferTypes(data, fields);

  fields = Object.keys(types);
  parsers = fields.map(function(field) {
    var type = types[field],
        parts, pattern;

    if (type && (type.indexOf('date:') === 0 || type.indexOf('utc:') === 0)) {
      parts = type.split(/:(.+)?/, 2);  // split on first :
      pattern = parts[1];

      if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
          (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
        pattern = pattern.slice(1, -1);
      }

      return parts[0] === 'utc' ? utcParse(pattern) : dateParse(pattern);
    }

    if (!typeParsers[type]) {
      throw Error('Illegal format pattern: ' + field + ':' + type);
    }

    return typeParsers[type];
  });

  for (i=0, n=data.length, m=fields.length; i<n; ++i) {
    datum = data[i];
    for (j=0; j<m; ++j) {
      field = fields[j];
      datum[field] = parsers[j](datum[field]);
    }
  }
}
