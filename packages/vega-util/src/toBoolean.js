export default function(_) {
  return _ == null || _ === '' ? null : !_ || _ === 'false' ? false : !!_;
}
