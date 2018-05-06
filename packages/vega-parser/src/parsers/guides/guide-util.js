import {Vertical} from './constants';
import {value} from '../../util';

export function lookup(name, spec, config) {
  return value(spec[name], config[name]);
}

export function isVertical(spec, configVal) {
  return value(spec.direction, configVal) === Vertical;
}

export function gradientLength(spec, config) {
  return value(
    spec.gradientLength,
    config.gradientLength || config.gradientWidth
  );
}

export function gradientThickness(spec, config) {
  return value(
    spec.gradientThickness,
    config.gradientThickness || config.gradientHeight
  );
}

export function entryColumns(spec, config) {
  return value(
    spec.columns,
    value(config.columns, +isVertical(spec, config.symbolDirection))
  );
}

export function getEncoding(name, encode) {
  var v = encode && (
    (encode.update && encode.update[name]) ||
    (encode.enter && encode.enter[name])
  );
  return v && v.signal ? v : v ? v.value : null;
}

export function getStyle(name, scope, style) {
  var s = scope.config.style[style];
  return s && s[name];
}
