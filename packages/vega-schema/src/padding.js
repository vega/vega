import { numberType, object, oneOf, signalRef } from './util.js';

const padding = oneOf(
  numberType,
  object({
    top: numberType,
    bottom: numberType,
    left: numberType,
    right: numberType
  }),
  signalRef
);

export default {
  padding
};
