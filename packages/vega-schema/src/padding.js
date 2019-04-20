import { object, oneOf, numberType } from './util';

const padding = oneOf(
  numberType,
  object({
    top: numberType,
    bottom: numberType,
    left: numberType,
    right: numberType
  })
);

export default {
  defs: {
    padding
  }
};
