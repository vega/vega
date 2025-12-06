export default function hasOwnProperty(object: object, property: PropertyKey): boolean {
  return (Object as any).hasOwn(object, property);
}
