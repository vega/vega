import { stringType } from './util';

const background = stringType;

const DESCRIPTION = "CSS color property to use as the background of the entire view.\n\n__Default value:__ none (transparent)";

Object.assign(background, { description: DESCRIPTION });

export default {
  defs: {
    background
  },
};
