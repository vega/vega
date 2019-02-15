export default function(child: ObjectConstructor, parent: ObjectConstructor): object {
  // as any so we can write the prototype
  var proto = ((child as any).prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}
