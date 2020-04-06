import {extend} from 'vega-util';

export default function () {
  // eslint-disable-next-line prefer-rest-params
  const args = [].slice.call(arguments);
  args.unshift({});
  // eslint-disable-next-line prefer-spread
  return extend.apply(null, args);
}
