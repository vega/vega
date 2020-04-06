export default function (child, parent) {
  const proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}
