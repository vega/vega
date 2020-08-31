import hasOwnProperty from './hasOwnProperty';

const NULL = {};

export default function(input) {
  let obj = {},
      test;

  function has(key) {
    return hasOwnProperty(obj, key) && obj[key] !== NULL;
  }

  const map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get(key) {
      return has(key) ? obj[key] : undefined;
    },
    set(key, value) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete(key) {
      if (has(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear() {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test(_) {
      if (arguments.length) {
        test = _;
        return map;
      } else {
        return test;
      }
    },
    clean() {
      const next = {};
      let size = 0;
      for (const key in obj) {
        const value = obj[key];
        if (value !== NULL && (!test || !test(value))) {
          next[key] = value;
          ++size;
        }
      }
      map.size = size;
      map.empty = 0;
      map.object = (obj = next);
    }
  };

  if (input) Object.keys(input).forEach(key => {
    map.set(key, input[key]);
  });

  return map;
}
