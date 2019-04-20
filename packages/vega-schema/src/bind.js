import {
  enums, not, object, oneOf, ref,
  arrayType, numberType, stringType
} from './util';

const Checkbox = 'checkbox',
      Radio = 'radio',
      Select = 'select',
      Range = 'range';

const element = stringType;
const elementRef = ref('element');

const bind = oneOf(
  object({
    _input_: enums([Checkbox]),
    element: elementRef,
    debounce: numberType,
    name: stringType
  }),
  object({
    _input_: enums([Radio, Select]),
    element: elementRef,
    _options_: arrayType,
    debounce: numberType,
    name: stringType
  }),
  object({
    _input_: enums([Range]),
    element: elementRef,
    min: numberType,
    max: numberType,
    step: numberType,
    debounce: numberType,
    name: stringType
  }),
  object({
    _input_: not(enums([Checkbox, Radio, Range, Select])),
    element: elementRef,
    debounce: numberType,
    name: stringType
  }, true)
)

export default {
  refs: {
    element
  },
  defs: {
    bind
  }
};
