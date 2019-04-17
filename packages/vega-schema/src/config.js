import { objectType } from './util';

const config = objectType;

const DESCRIPTION = "Configure defaults for visual encoding choices.";

Object.assign(config, { description: DESCRIPTION });

export default {
  defs: {
    config
  },
};
