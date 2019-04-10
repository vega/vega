import { objectType } from '../util';
import { en } from '../consts';
import { ENGLISH } from './description';

const usermeta = objectType;

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(usermeta, { description: ENGLISH })
    break
  default:
    Object.assign(usermeta, { description: ENGLISH })
    break
}

export default {
  defs: {
    usermeta
  },
};
