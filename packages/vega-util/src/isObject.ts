export default function isObject(_: unknown): _ is object {
  return _ === Object(_);
}
