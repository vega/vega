import {enums, object, oneOf, booleanType} from './util';

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

Object.assign(autosize, { description: "Sets how the visualization size should be determined. If a string, should be one of `\"pad\"`, `\"fit\"` or `\"none\"`.\nObject values can additionally specify parameters for content sizing and automatic resizing.\n`\"fit\"` is only supported for single and layered views that don't use `rangeStep`.\n\n__Default value__: `pad`" });

export default {
  defs: {
    autosize
  }
};
