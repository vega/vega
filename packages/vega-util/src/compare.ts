import accessor, { Accessor, accessorFields } from './accessor.js';
import array from './array.js';
import field, { FieldOptions } from './field.js';
import isFunction from './isFunction.js';

const DESCENDING = 'descending';

export type Order = 'ascending' | 'descending';
export type ComparatorFunction<T = any> = (a: T, b: T) => number;
export type FieldSpec<T = any> = string | Accessor<T> | null;

export interface CompareOptions extends FieldOptions {
  comparator?: <T>(fields: Accessor<T>[], orders: number[]) => ComparatorFunction<T>;
}

export default function compare<T = any>(
  fields?: FieldSpec<T> | FieldSpec<T>[],
  orders?: Order | Order[],
  opt?: CompareOptions
): Accessor<[T, T], number> | null {
  const options = opt || {};
  const orderArray = array(orders) || [];

  const ord: number[] = [];
  const get: Accessor<T>[] = [];
  const fmap: Record<string, number> = {};
  const gen = options.comparator || comparator;

  array(fields).forEach((f, i) => {
    if (f == null) return;
    ord.push(orderArray[i] === DESCENDING ? -1 : 1);
    get.push(f = isFunction(f) ? f as Accessor<T> : field(f as string, undefined, opt));
    (accessorFields(f) || []).forEach(_ => fmap[_] = 1);
  });

  return get.length === 0
    ? null
    : accessor(gen(get, ord) as any, Object.keys(fmap));
}

export const ascending = (u: any, v: any): number => (u < v || u == null) && v != null ? -1
  : (u > v || v == null) && u != null ? 1
  : ((v = v instanceof Date ? +v : v), (u = u instanceof Date ? +u : u)) !== u && v === v ? -1
  : v !== v && u === u ? 1
  : 0;

const comparator = <T>(fields: Accessor<T>[], orders: number[]): ComparatorFunction<T> => fields.length === 1
  ? compare1(fields[0], orders[0])
  : compareN(fields, orders, fields.length);

const compare1 = <T>(field: Accessor<T>, order: number): ComparatorFunction<T> => function(a, b) {
  return ascending(field(a), field(b)) * order;
};

const compareN = <T>(fields: Accessor<T>[], orders: number[], n: number): ComparatorFunction<T> => {
  orders.push(0);
  return function(a, b) {
    let f: Accessor<T>, c = 0, i = -1;
    while (c === 0 && ++i < n) {
      f = fields[i];
      c = ascending(f(a), f(b));
    }
    return c * orders[i];
  };
};
