import { objectType } from './util';

const config = objectType;

Object.assign(config, { description: "Configure defaults for visual encoding choices." });

export default {
  defs: {
    config
  },
};
