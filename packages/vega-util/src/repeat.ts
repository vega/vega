export default function(str: string, reps: number) {
  var s = '';
  while (--reps >= 0) s += str;
  return s;
}
