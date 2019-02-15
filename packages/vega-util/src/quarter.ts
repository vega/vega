export function quarter(date: Date | number): number {
  return 1 + ~~(new Date(date).getMonth() / 3);
}

export function utcquarter(date: Date | number): number {
  return 1 + ~~(new Date(date).getUTCMonth() / 3);
}
