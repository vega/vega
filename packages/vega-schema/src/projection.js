import {
  array, arrayType, numberOrSignal, object,
  objectType, oneOf, orSignal, stringOrSignal, stringType
} from './util';

const array2 = orSignal(array(numberOrSignal, {minItems: 2, maxItems: 2}));
const array3 = orSignal(array(numberOrSignal, {minItems: 2, maxItems: 3}));
const extent = orSignal(array(array2, {minItems: 2, maxItems: 2}));

const projection = object({
  _name_: stringType,
  type: stringOrSignal,
  clipAngle: numberOrSignal,
  clipExtent: extent,
  scale: numberOrSignal,
  translate: array2,
  center: array2,
  rotate: array3,
  parallels: array2,
  precision: numberOrSignal,
  pointRadius: numberOrSignal,
  fit: oneOf(objectType, arrayType),
  extent: extent,
  size: array2
}, true);

export default {
  projection
};
