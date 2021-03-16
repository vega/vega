import {booleanType, enums, object, oneOf, signalRef} from './util';

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
  }),
  signalRef
);

export default {
  autosize
};
