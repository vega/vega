import {
  array, object, oneOf, orSignal,
  arrayType, objectType, stringType, numberOrSignal, stringOrSignal
} from '../util';
import { en } from '../consts';
import { ENGLISH } from './description';

const array2 = orSignal(array(numberOrSignal, {minItems: 2, maxItems: 2}));
const array3 = orSignal(array(numberOrSignal, {minItems: 2, maxItems: 3}));
const extent = orSignal(array(array2, {minItems: 2, maxItems: 2}));

const projection = object({
  _name_: stringType,
  "type": stringOrSignal,
  "clipAngle": numberOrSignal,
  "clipExtent": extent,
  "scale": numberOrSignal,
  "translate": array2,
  "center": array2,
  "rotate": array3,
  "parallels": array2,
  "precision": numberOrSignal,
  "pointRadius": numberOrSignal,
  "fit": oneOf(objectType, arrayType),
  "extent": extent,
  "size": array2
}, true);

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(projection, { description: ENGLISH })
    break
  default:
    Object.assign(projection, { description: ENGLISH })
    break
}

export default {
  defs: {
    projection
  }
};
