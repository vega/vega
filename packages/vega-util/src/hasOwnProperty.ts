export default function hasOwnProperty(object: object, property: PropertyKey): boolean {
  // @ts-ignore - Object.hasOwn is available at runtime (ES2022) but not in lib target (es2021)
  // This is safe because Object.hasOwn(obj, prop) is equivalent to Object.prototype.hasOwnProperty.call(obj, prop)
  // and properly handles objects without a hasOwnProperty method (like Object.create(null))
  return Object.hasOwn(object, property);
}
