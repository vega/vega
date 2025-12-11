import hasOwnProperty from './hasOwnProperty.js';

const NULL = {};

export interface FastMap<T = any> {
  size: number;
  empty: number;
  object: Record<string, T | typeof NULL>;
  has(key: string): boolean;
  get(key: string): T | undefined;
  set(key: string, value: T): FastMap<T>;
  delete(key: string): FastMap<T>;
  clear(): void;
  test(fn?: (value: T) => boolean): ((value: T) => boolean) | undefined | FastMap<T>;
  clean(): void;
}

export default function fastmap<T = any>(input?: Record<string, T>): FastMap<T> {
  let obj: Record<string, T | typeof NULL> = {},
      test: ((value: T) => boolean) | undefined;

  function has(key: string): boolean {
    return hasOwnProperty(obj, key) && obj[key] !== NULL;
  }

  function isValue(value: T | typeof NULL): value is T {
    return value !== NULL;
  }

  const map: FastMap<T> = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get(key: string): T | undefined {
      if (!has(key)) return undefined;
      const value = obj[key];
      return isValue(value) ? value : undefined;
    },
    set(key: string, value: T): FastMap<T> {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete(key: string): FastMap<T> {
      if (has(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear(): void {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test(fn?: (value: T) => boolean): ((value: T) => boolean) | undefined | FastMap<T> {
      if (arguments.length) {
        test = fn;
        return map;
      } else {
        return test;
      }
    },
    clean(): void {
      const next: Record<string, T | typeof NULL> = {};
      let size = 0;
      for (const key in obj) {
        const value = obj[key];
        if (isValue(value) && (!test || !test(value))) {
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
