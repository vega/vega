export default function(
  array: any[] | undefined,
  filter: (any: any) => boolean | undefined,
  visitor: (v: any, i: number, arr: any[]) => void,
) {
  if (array) {
    var i = 0,
      n = array.length,
      t;
    if (filter) {
      for (; i < n; ++i) {
        if ((t = filter(array[i]))) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}
