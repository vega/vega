import extend from './extend.js';

type Constructor = new (...args: never[]) => unknown;

export default function<C extends Constructor, P extends Constructor>(
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
