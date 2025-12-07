import extend from './extend.js';

export default function<C extends new (...args: any[]) => any, P extends new (...args: any[]) => any>(
  child: C,
  parent: P,
  members?: object
): object {
  const proto = (child.prototype = Object.create(parent.prototype));
  Object.defineProperty(proto, 'constructor', {
    value: child,
    writable: true,
    enumerable: true,
    configurable: true
  });
  return extend(proto, members || {});
}
