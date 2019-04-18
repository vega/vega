import { objectType } from './util';

const usermeta = objectType;

Object.assign(usermeta, { description: "Optional metadata that will be passed to Vega.\nThis object is completely ignored by Vega and Vega-Lite and can be used for custom metadata." })

export default {
  defs: {
    usermeta
  },
};
