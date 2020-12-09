import {merge} from 'vega-util';

export default function(idFunc, source, input) {
  const $ = idFunc;
  let data = source || [],
      add = input || [],
      rem = {},
      cnt = 0;

  return {
    add: t => add.push(t),
    remove: t => rem[$(t)] = ++cnt,
    size: () => data.length,
    data: (compare, resort) => {
      if (cnt) {
        data = data.filter(t => !rem[$(t)]);
        rem = {};
        cnt = 0;
      }
      if (resort && compare) {
        data.sort(compare);
      }
      if (add.length) {
        data = compare
          ? merge(compare, data, add.sort(compare))
          : data.concat(add);
        add = [];
      }
      return data;
    }
  };
}