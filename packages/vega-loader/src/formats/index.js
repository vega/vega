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
  if (arguments.length > 1) {
    formats[name] = format;
    return this;
  } else {
    return formats.hasOwnProperty(name) ? formats[name] : null;
  }
}
