import hasOwnProperty from './hasOwnProperty.js';

const NULL = {};

export interface FastMap<T> {
  size: number;
  empty: number;
  object: Record<string, T | typeof NULL>;
  has: (key: string) => boolean;
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => FastMap<T>;
  delete: (key: string) => FastMap<T>;
  clear: () => void;
  test(): ((value: T) => boolean) | undefined;
  test(testFn: (value: T) => boolean): FastMap<T>;
  clean: () => void;
}

export default function<T>(input?: Record<string, T>): FastMap<T> {
  let obj: Record<string, T | typeof NULL> = {};
  let test: ((value: T) => boolean) | undefined;

  function has(key: string) {
    return hasOwnProperty(obj, key) && obj[key] !== NULL;
  }

  // Type guard to narrow T | typeof NULL to T
  function isValue(value: T | typeof NULL): value is T {
    return value !== NULL;
  }

  // Implement test method separately to handle overloads properly
  function testMethod(): ((value: T) => boolean) | undefined;
  function testMethod(testFn: (value: T) => boolean): FastMap<T>;
  function testMethod(testFn?: (value: T) => boolean): FastMap<T> | ((value: T) => boolean) | undefined {
    if (arguments.length) {
      test = testFn;
      return map;
    } else {
      return test;
    }
  }

  const map: FastMap<T> = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get(key: string) {
      if (!has(key)) return undefined;
      const value = obj[key];
      // Type guard: has(key) ensures value !== NULL, so value must be T
      return isValue(value) ? value : undefined;
    },
    set(key: string, value: T) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete(key: string) {
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
    test: testMethod,
    clean() {
      const next: Record<string, T | typeof NULL> = {};
      let size = 0;
      for (const key in obj) {
        const value = obj[key];
        // Type guard: isValue(value) narrows type from T | typeof NULL to T
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
