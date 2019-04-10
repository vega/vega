import { numberType } from '../util';
import { en } from '../consts'
import { ENGLISH } from './description';

const height = numberType;

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(height, { description: ENGLISH })
    break
  default:
    Object.assign(height, { description: ENGLISH })
    break
}

export default {
  defs: {
    height
  },
};