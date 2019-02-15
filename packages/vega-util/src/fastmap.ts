var NULL = {};

export default function(input: any) {
  var obj: { [key: string]: any } = {},
    map: {
      size: number;
      empty: number;
      object: any;
      has: (_: string) => boolean;
      get: (_: string) => any;
      set: (_: string, v: any) => void;
      delete: (_: string) => void;
      test: (_: string) => any;
      clear: () => void;
      clean: () => void;
    },
    test: string | any;

  function has(key: string) {
    return obj.hasOwnProperty(key) && obj[key] !== NULL;
  }

  map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get: function(key: string) {
      return has(key) ? obj[key] : undefined;
    },
    set: function(key: string, value: any) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete: function(key: string) {
      if (has(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear: function() {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test: function(_: string) {
      if (arguments.length) {
        test = _;
        return map;
      } else {
        return test;
      }
    },
    clean: function() {
      var next: any = {},
        size = 0,
        key,
        value;
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
    },
  };

  if (input)
    Object.keys(input).forEach(function(key) {
      map.set(key, input[key]);
    });

  return map;
}
