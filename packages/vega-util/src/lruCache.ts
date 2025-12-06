import has from './hasOwnProperty.js';

const DEFAULT_MAX_SIZE = 10000;

export interface LRUCache<T> {
  clear: () => void;
  has: (key: string) => boolean;
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => T;
}

export default function<T>(maxsize?: number): LRUCache<T> {
  maxsize = +maxsize! || DEFAULT_MAX_SIZE;

  let curr: Record<string, T>, prev: Record<string, T>, size: number;

  const clear = () => {
    curr = {};
    prev = {};
    size = 0;
  };

  const update = (key: string, value: T) => {
    if (++size > maxsize!) {
      prev = curr;
      curr = {};
      size = 1;
    }
    return (curr[key] = value);
  };

  clear();

  return {
    clear,
    has: (key: string) => has(curr, key) || has(prev, key),
    get: (key: string) => has(curr, key) ? curr[key]
        : has(prev, key) ? update(key, prev[key])
        : undefined,
    set: (key: string, value: T) => has(curr, key)
        ? (curr[key] = value)
        : update(key, value)
  };
}
