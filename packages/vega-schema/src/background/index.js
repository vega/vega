import { stringType } from '../util';
import { en } from '../consts';
import { ENGLISH } from './description';

const background = stringType;

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(background, { description: ENGLISH })
    break
  default:
    Object.assign(background, { description: ENGLISH })
    break
}

export default {
  defs: {
    background
  },
};
