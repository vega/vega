import extend from './extend';

export default function(child, parent, members) {
  const proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return extend(proto, members);
}
