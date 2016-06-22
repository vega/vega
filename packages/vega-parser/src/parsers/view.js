import parseSignal from './signal';
import parseScale from './scale';
import parseData from './data';
import parseMark from './mark';

var parsers = [
  {name: 'signals', parse: parseSignal},
  {name: 'data',    parse: parseData},
  {name: 'scales',  parse: parseScale},
  {name: 'marks',   parse: parseMark}
];

export default function parseView(spec, scope) {
  parsers.forEach(function(parser) {
    var s = spec[parser.name];
    if (s) s.forEach(function(_) { parser.parse(_, scope); });
  });
}
