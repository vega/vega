import isArray from "./isArray";
import isObject from "./isObject";
import hasOwnProperty from "./hasOwnProperty";

export default function mergeDeep(dest, ...src) {
  for (const s of src) {
    dest = mergeDeep_(dest, s);
  }
  return dest;
}

function mergeDeep_(dest, src) {
  if (!isObject(src) || src === null) {
    return dest;
  }

  for (const p in src) {
    if (!hasOwnProperty(src, p)) {
      continue;
    }
    if (src[p] === undefined) {
      continue;
    }
    if (!isObject(src[p]) || isArray(src[p]) || src[p] === null) {
      dest[p] = src[p];
    } else if (!isObject(dest[p]) || dest[p] === null) {
      dest[p] = mergeDeep(isArray(src[p].constructor) ? [] : {}, src[p]);
    } else {
      mergeDeep(dest[p], src[p]);
    }
  }
  return dest;
}
