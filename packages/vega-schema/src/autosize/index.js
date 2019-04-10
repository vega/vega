import {enums, object, oneOf, booleanType} from '../util';
import { en } from '../consts';
import { ENGLISH } from './description';

const autosizeEnum = [
  'pad',
  'fit',
  'fit-x',
  'fit-y',
  'none'
];

const containsEnum = [
  'content',
  'padding'
];

const autosizeType = enums(autosizeEnum, {default: 'pad'});

const autosize = oneOf(
  autosizeType,
  object({
    _type_: autosizeType,
    resize: booleanType,
    contains: enums(containsEnum)
  })
);

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(autosize, { description: ENGLISH })
    break
  default:
    Object.assign(autosize, { description: ENGLISH })
    break
}

export default {
  defs: {
    autosize
  }
};
