export default function isString(_: unknown): _ is string {
  return typeof _ === 'string';
}
