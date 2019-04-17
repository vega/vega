import { objectType } from './util';

const usermeta = objectType;

const DESCRIPTION = "Optional metadata that will be passed to Vega.\nThis object is completely ignored by Vega and Vega-Lite and can be used for custom metadata.";

Object.assign(usermeta, { description: DESCRIPTION })

export default {
  defs: {
    usermeta
  },
};
