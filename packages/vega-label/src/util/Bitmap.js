const DIV = 5,   // bit shift from x, y index to bit vector array index
      MOD = 31,  // bit mask for index lookup within a bit vector
      SIZE = 32, // individual bit vector size
      RIGHT0 = new Uint32Array(SIZE + 1), // left-anchored bit vectors, full -> 0
      RIGHT1 = new Uint32Array(SIZE + 1); // right-anchored bit vectors, 0 -> full

RIGHT1[0] = 0;
RIGHT0[0] = ~RIGHT1[0];
for (let i=1; i <= SIZE; ++i) {
  RIGHT1[i] = (RIGHT1[i - 1] << 1) | 1;
  RIGHT0[i] = ~RIGHT1[i];
}

export default function(w, h) {
  const array = new Uint32Array(~~((w * h + SIZE) / SIZE));

  function _set(index, mask) {
    array[index] |= mask;
  }

  function _clear(index, mask) {
    array[index] &= mask;
  }

  return {
    array: array,

    get: (x, y) => {
      const index = y * w + x;
      return array[index >>> DIV] & (1 << (index & MOD));
    },

    set: (x, y) => {
      const index = y * w + x;
      _set(index >>> DIV, 1 << (index & MOD));
    },

    clear: (x, y) => {
      const index = y * w + x;
      _clear(index >>> DIV, ~(1 << (index & MOD)));
    },

    getRange: (x, y, x2, y2) => {
      let r = y2, start, end, indexStart, indexEnd;
      for (; r >= y; --r) {
        start = r * w + x;
        end = r * w + x2;
        indexStart = start >>> DIV;
        indexEnd = end >>> DIV;
        if (indexStart === indexEnd) {
          if (array[indexStart] & RIGHT0[start & MOD] & RIGHT1[(end & MOD) + 1]) {
            return true;
          }
        } else {
          if (array[indexStart] & RIGHT0[start & MOD]) return true;
          if (array[indexEnd] & RIGHT1[(end & MOD) + 1]) return true;
          for (let i = indexStart + 1; i < indexEnd; ++i) {
            if (array[i]) return true;
          }
        }
      }
      return false;
    },

    setRange: (x, y, x2, y2) => {
      let start, end, indexStart, indexEnd, i;
      for (; y <= y2; ++y) {
        start = y * w + x;
        end = y * w + x2;
        indexStart = start >>> DIV;
        indexEnd = end >>> DIV;
        if (indexStart === indexEnd) {
          _set(indexStart, RIGHT0[start & MOD] & RIGHT1[(end & MOD) + 1]);
        } else {
          _set(indexStart, RIGHT0[start & MOD]);
          _set(indexEnd, RIGHT1[(end & MOD) + 1]);
          for (i = indexStart + 1; i < indexEnd; ++i) _set(i, 0xffffffff);
        }
      }
    },

    clearRange: (x, y, x2, y2) => {
      let start, end, indexStart, indexEnd, i;
      for (; y <= y2; ++y) {
        start = y * w + x;
        end = y * w + x2;
        indexStart = start >>> DIV;
        indexEnd = end >>> DIV;
        if (indexStart === indexEnd) {
          _clear(indexStart, RIGHT1[start & MOD] | RIGHT0[(end & MOD) + 1]);
        } else {
          _clear(indexStart, RIGHT1[start & MOD]);
          _clear(indexEnd, RIGHT0[(end & MOD) + 1]);
          for (i = indexStart + 1; i < indexEnd; ++i) _clear(i, 0);
        }
      }
    },

    outOfBounds: (x, y, x2, y2) => x < 0 || y < 0 || y2 >= h || x2 >= w
  };
}