import { object, oneOf, numberType } from '../util';
import { en } from '../consts'
import { ENGLISH } from './description';

const padding = oneOf(
  numberType,
  object({
    top: numberType,
    bottom: numberType,
    left: numberType,
    right: numberType
  })
);

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(padding, { description: ENGLISH })
    break
  default:
    Object.assign(padding, { description: ENGLISH })
    break
}

export default {
  defs: {
    padding
  }
};
