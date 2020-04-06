import hasOwnProperty from './hasOwnProperty';

const NULL = {};

export default function (input) {
  let obj = {};
  let test;

  function has(key) {
    return hasOwnProperty(obj, key) && obj[key] !== NULL;
  }

  const map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get: function (key) {
      return has(key) ? obj[key] : undefined;
    },
    set: function (key, value) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete: function (key) {
      if (has(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear: function () {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test: function (_) {
      if (arguments.length) {
        test = _;
        return map;
      } else {
        return test;
      }
    },
    clean: function () {
      const next = {};
      let size = 0;
      let key;
      let value;
      for (key in obj) {
        value = obj[key];
        if (value !== NULL && (!test || !test(value))) {
          next[key] = value;
          ++size;
        }
      }
      map.size = size;
      map.empty = 0;
      map.object = obj = next;
    }
  };

  if (input)
    Object.keys(input).forEach(function (key) {
      map.set(key, input[key]);
    });

  return map;
}
