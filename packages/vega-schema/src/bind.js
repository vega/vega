import {
  array, arrayType, def, enums, not, numberType, object, oneOf, stringType
} from './util';

const Checkbox = 'checkbox',
      Radio = 'radio',
      Select = 'select',
      Range = 'range';

const element = stringType;
const elementRef = def('element');

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
    labels: array(stringType),
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
  }, true),
  object({
    _element_: elementRef,
    event: stringType,
    debounce: numberType
  })
);

export default {
  bind,
  element
};
