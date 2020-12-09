export default function(array, filter, visitor) {
  if (array) {
    if (filter) {
      const n = array.length;
      for (let i = 0; i < n; ++i) {
        const t = filter(array[i]);
        if (t) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}
