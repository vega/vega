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
      const dim = this,
            range = dim.bisect(dim.range, added.value),
            idx = added.index,
            lo = range[0],
            hi = range[1],
            n1 = idx.length;
      let i;

      for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
      for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
      return dim;
    }
  };
}
