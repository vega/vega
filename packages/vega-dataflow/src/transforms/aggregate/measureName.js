export default function(op, mname, as) {
  return as || (op + (!mname ? '' : '_' + mname));
}
