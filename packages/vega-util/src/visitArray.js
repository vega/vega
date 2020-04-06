export default function (array, filter, visitor) {
  if (array) {
    let i = 0;
    const n = array.length;
    let t;
    if (filter) {
      for (; i < n; ++i) {
        if ((t = filter(array[i]))) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}
