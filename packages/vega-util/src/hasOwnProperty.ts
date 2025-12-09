export default function hasOwnProperty(object: object, property: PropertyKey): boolean {
  return Object.hasOwn(object, property);
}
