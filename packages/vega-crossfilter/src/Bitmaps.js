import {array16, array32, array8} from './arrays.js';

/**
 * Maintains CrossFilter state.
 */
export default function Bitmaps() {

  let width = 8,
      data = [],
      seen = array32(0),
      curr = array(0, width),
      prev = array(0, width);

  return {
    data: () => data,

    seen: () => (seen = lengthen(seen, data.length)),

    add(array) {
      for (let i=0, j=data.length, n=array.length, t; i<n; ++i) {
        t = array[i];
        t._index = j++;
        data.push(t);
      }
    },

    remove(num, map) { // map: index -> boolean (true => remove)
      const n = data.length,
            copy = Array(n - num),
            reindex = data; // reuse old data array for index map
      let t, i, j;

      // seek forward to first removal
      for (i=0; !map[i] && i<n; ++i) {
        copy[i] = data[i];
        reindex[i] = i;
      }

      // condense arrays
      for (j=i; i<n; ++i) {
        t = data[i];
        if (!map[i]) {
          reindex[i] = j;
          curr[j] = curr[i];
          prev[j] = prev[i];
          copy[j] = t;
          t._index = j++;
        } else {
          reindex[i] = -1;
        }
        curr[i] = 0; // clear unused bits
      }

      data = copy;
      return reindex;
    },

    size: () => data.length,

    curr: () => curr,

    prev: () => prev,

    reset: k => prev[k] = curr[k],

    all: () =>
      width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff,

    set(k, one) { curr[k] |= one; },

    clear(k, one) { curr[k] &= ~one; },

    resize(n, m) {
      const k = curr.length;
      if (n > k || m > width) {
        width = Math.max(m, width);
        curr = array(n, width, curr);
        prev = array(n, width);
      }
    }
  };
}

function lengthen(array, length, copy) {
  if (array.length >= length) return array;
  copy = copy || new array.constructor(length);
  copy.set(array);
  return copy;
}

function array(n, m, array) {
  const copy = (m < 0x101 ? array8
      : m < 0x10001 ? array16
      : array32)(n);
  if (array) copy.set(array);
  return copy;
}
