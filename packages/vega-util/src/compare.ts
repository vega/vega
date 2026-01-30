import {Accessor, default as accessor, accessorFields} from './accessor.js';
import array from './array.js';
import field, { FieldOptions } from './field.js';
import isFunction from './isFunction.js';

type Comparable = string | number | boolean | Date | null | undefined;

type SortOrder = 'descending' | 'ascending' | string;

/** A single field specification - either a field path string or an accessor function. */
type FieldSpec = string | Accessor | ((obj: unknown) => unknown);

type FieldsInput = FieldSpec | readonly FieldSpec[] | null | undefined;

type OrdersInput = SortOrder | readonly SortOrder[] | null | undefined;

type CompareFn = (a: unknown, b: unknown) => number;

/** A function that generates a comparator from field accessors and order multipliers. */
type ComparatorGenerator = (fields: Accessor[], orders: number[]) => CompareFn;

export interface CompareOptions extends FieldOptions {
  comparator?: ComparatorGenerator;
}

const DESCENDING = 'descending';

export default function compare(
  inputFields: FieldsInput,
  inputOrders?: OrdersInput,
  inputOpt?: CompareOptions
): Accessor<number> | null {
  const opt: CompareOptions = inputOpt || {};
  const orders = array(inputOrders) || [];

  const ord: number[] = [], get: Accessor[] = [], fmap: Record<string, number> = {},
        gen = opt.comparator || comparator;

  array(inputFields).forEach((f, i) => {
    if (f == null) return;
    ord.push(orders[i] === DESCENDING ? -1 : 1);
    const accessor = isFunction(f) ? f as Accessor : field(f as string, undefined, opt);
    get.push(accessor);
    (accessorFields(accessor) || []).forEach(_ => fmap[_] = 1);
  });

  return get.length === 0
    ? null
    : accessor(gen(get, ord), Object.keys(fmap));
}

export const ascending = (_u: Comparable, _v: Comparable): -1 | 0 | 1 => {
  let u: Comparable = _u;
  let v: Comparable = _v;
  return (u! < v! || u == null) && v != null ? -1
    : (u! > v! || v == null) && u != null ? 1
    : ((v = v instanceof Date ? +v : v), (u = u instanceof Date ? +u : u)) !== u && v === v ? -1
    : v !== v && u === u ? 1
    : 0;
};

const comparator: ComparatorGenerator = (fields, orders) => fields.length === 1
  ? compare1(fields[0], orders[0])
  : compareN(fields, orders, fields.length);

const compare1 = (field: Accessor, order: number): CompareFn => function(a, b) {
  return ascending(field(a) as Comparable, field(b) as Comparable) * order;
};

const compareN = (fields: Accessor[], orders: number[], n: number): CompareFn => {
  orders.push(0); // pad zero for convenient lookup
  return function(a, b) {
    let f: Accessor, c = 0, i = -1;
    while (c === 0 && ++i < n) {
      f = fields[i];
      c = ascending(f(a) as Comparable, f(b) as Comparable);
    }
    return c * orders[i];
  };
};
