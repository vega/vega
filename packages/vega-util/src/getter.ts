export default function getter(path: string[]): (obj: unknown) => unknown {
  return path.length === 1 ? get1(path[0]) : getN(path);
}

const get1 = (field: string) => function(obj: unknown): unknown {
  // @ts-ignore - TypeScript doesn't allow indexing unknown, but runtime behavior is safe
  return obj[field];
};

const getN = (path: string[]) => {
  const len = path.length;
  return function(obj: unknown): unknown {
    let current: unknown = obj;
    for (let i = 0; i < len; ++i) {
      // @ts-ignore - TypeScript doesn't allow indexing unknown, but runtime behavior is safe
      current = current[path[i]];
    }
    return current;
  };
};
