import {extend} from '@omni-co/vega-util';

export default function() {
  const args = [].slice.call(arguments);
  args.unshift({});
  return extend(...args);
}
