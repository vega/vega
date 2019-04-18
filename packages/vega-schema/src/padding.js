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

Object.assign(padding, { description: "The default visualization padding, in pixels, from the edge of the visualization canvas to the data rectangle.  If a number, specifies padding for all sides.\nIf an object, the value should have the format `{\"left\": 5, \"top\": 5, \"right\": 5, \"bottom\": 5}` to specify padding for each side of the visualization.\n\n__Default value__: `5`" })

export default {
  defs: {
    padding
  }
};
