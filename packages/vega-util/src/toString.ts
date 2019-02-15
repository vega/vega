export default function(_: any): string | null {
  return _ == null || _ === '' ? null : _ + '';
}
