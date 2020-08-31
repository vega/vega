export function multikey(f) {
  return x => {
    const n = f.length;
    let i = 1,
        k = String(f[0](x));

    for (; i<n; ++i) {
      k += '|' + f[i](x);
    }

    return k;
  };
}

export function groupkey(fields) {
  return !fields || !fields.length ? function() { return ''; }
    : fields.length === 1 ? fields[0]
    : multikey(fields);
}
