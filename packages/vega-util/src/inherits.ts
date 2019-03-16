export default function<C extends object, P extends object>(child: C, parent: P): C & P {
  // as any so we can write the prototype
  var proto = ((child as any).prototype = Object.create((parent as any).prototype));
  proto.constructor = child;
  return proto;
}
