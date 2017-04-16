export default function(_, parser) {
  return _ == null || _ === '' ? null : (parser ? parser(_) : Date.parse(_));
}
