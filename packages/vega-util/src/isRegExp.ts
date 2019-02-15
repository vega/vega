export default function(_: any): _ is RegExp {
  return Object.prototype.toString.call(_) === '[object RegExp]';
}
