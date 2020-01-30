// adapted from https://github.com/dominictarr/hashlru/blob/map/index.js
export function lru(max) {
  if (!max) {
    throw Error("hashlru must have a max value, of type number, greater than 0");
  }

  let size = 0,
    cache = new Map(),
    _cache = new Map();

  function update(key, value) {
    cache.set(key, value);
    size++;
    if (size >= max) {
      size = 0;
      _cache = cache;
      cache = new Map();
    }
  }

  return {
    has: (key) => {
      return cache.has(key) || _cache.has(key);
    },
    remove: (key) => {
      cache.delete(key);
      _cache.delete(key);
    },
    get: (key) => {
      if (cache.has(key)) {
        return cache.get(key);
      }
      if (_cache.has(key)) {
        var v = _cache.get(key);
        update(key, v);
        return v;
      }
    },
    set: (key, value) => {
      if (cache.has(key)) cache.set(key, value);
      else update(key, value);
    },
    clear: () => {
      cache = new Map();
      _cache = new Map();
    },
    size: () => {
      return size;
    }
  };
}
