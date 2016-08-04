import {default as dsv, delimitedFormat} from './dsv';
import json from './json';
import topojson from './topojson';

var formats = {
  dsv: dsv,
  csv: delimitedFormat(','),
  tsv: delimitedFormat('\t'),
  json: json,
  topojson: topojson
};

export default function(name, format) {
  return arguments.length > 1 ? (formats[name] = format, this)
    : formats.hasOwnProperty(name) ? formats[name] : null;
}
