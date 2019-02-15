export default function(_: any): _ is Date {
  return Object.prototype.toString.call(_) === '[object Date]';
}
