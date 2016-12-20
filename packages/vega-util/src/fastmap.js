var NULL = {};

export default function(clean) {
  var obj = {}, map;

  function has(key) {
    return obj.hasOwnProperty(key) && obj[key] !== NULL;
  }

  return map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get: function(key) {
      return has(key) ? obj[key] : undefined;
    },
    set: function(key, value) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete: function(key) {
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
    clean: function() {
      var next = {}, key, value;
      for (key in obj) {
        value = obj[key];
        if (value !== NULL && (!clean || !clean(value))) {
          next[key] = value;
        }
      }
      map.empty = 0;
      map.object = (obj = next);
    }
  };
}
