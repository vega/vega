export function canonicalType(type) {
  return (type + '').toLowerCase();
}
export function isOperator(type) {
   return canonicalType(type) === 'operator';
}

export function isCollect(type) {
  return canonicalType(type) === 'collect';
}
