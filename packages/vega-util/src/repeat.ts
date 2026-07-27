/**
 * Repeat a string a specified number of times.
 */
export default function repeat(str: string, reps: number): string {
  let s = '';
  while (--reps >= 0) s += str;
  return s;
}
