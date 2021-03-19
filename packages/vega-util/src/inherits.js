import extend from './extend';

export default function(child, parent, members) {
  const proto = (child.prototype = Object.create(parent.prototype));
  Object.defineProperty(proto, 'constructor', {
    value: child,
    writable: true,
    enumerable: true,
    configurable: true
  });
  return extend(proto, members);
}
