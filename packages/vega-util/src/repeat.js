export default function(str, reps) {
  let s = '';
  while (--reps >= 0) s += str;
  return s;
}
