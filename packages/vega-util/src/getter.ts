export default function getter(path: string[]): (obj: any) => any {
  return path.length === 1 ? get1(path[0]) : getN(path);
}

const get1 = (field: string) => function(obj: any): any {
  return obj[field];
};

const getN = (path: string[]) => {
  const len = path.length;
  return function(obj: any): any {
    for (let i = 0; i < len; ++i) {
      obj = obj[path[i]];
    }
    return obj;
  };
};
