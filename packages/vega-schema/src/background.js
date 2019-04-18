import { stringType } from './util';

const background = stringType;

Object.assign(background, { description: "CSS color property to use as the background of the entire view.\n\n__Default value:__ none (transparent)" });

export default {
  defs: {
    background
  },
};
