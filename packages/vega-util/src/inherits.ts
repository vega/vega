import extend from './extend.js';

export default function(
  child: new (...args: any[]) => any,
  parent: new (...args: any[]) => any,
  members?: object
): any {
  const proto = (child.prototype = Object.create(parent.prototype));
  Object.defineProperty(proto, 'constructor', {
    value: child,
    writable: true,
    enumerable: true,
    configurable: true
  });
  return extend(proto, members || {});
}
