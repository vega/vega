export default function getter(path: string[]): (obj: unknown) => unknown {
  return path.length === 1 ? get1(path[0]) : getN(path);
}

const get1 = (field: string) => function(obj: unknown): unknown {
  return (obj as Record<string, unknown>)[field];
};

const getN = (path: string[]) => {
  const len = path.length;
  return function(obj: unknown): unknown {
    for (let i = 0; i < len; ++i) {
      obj = (obj as Record<string, unknown>)[path[i]];
    }
    return obj;
  };
};
