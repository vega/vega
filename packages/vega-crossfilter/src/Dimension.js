export default function(index, i, query) {
  const bit = (1 << i);

  return {
    one:     bit,
    zero:    ~bit,
    range:   query.slice(),
    bisect:  index.bisect,
    index:   index.index,
    size:    index.size,

    onAdd(added, curr) {
      const dim = this;
      const range = dim.bisect(dim.range, added.value);
      const idx = added.index;
      const lo = range[0];
      const hi = range[1];
      const n1 = idx.length;
      let i;

      for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
      for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
      return dim;
    }
  };
}
