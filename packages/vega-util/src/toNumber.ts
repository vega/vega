export default function(_: any): number | null {
  return _ == null || _ === '' ? null : +_;
}
