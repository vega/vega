import {identity} from 'vega-util';

export default function UniqueList(idFunc) {
  const $ = idFunc || identity,
        list = [],
        ids = {};

  list.add = _ => {
    const id = $(_);
    if (!ids[id]) {
      ids[id] = 1;
      list.push(_);
    }
    return list;
  };

  list.remove = _ => {
    const id = $(_);
    if (ids[id]) {
      ids[id] = 0;
      const idx = list.indexOf(_);
      if (idx >= 0) list.splice(idx, 1);
    }
    return list;
  };

  return list;
}
