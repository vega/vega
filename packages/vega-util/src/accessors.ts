import accessor, { Accessor } from './accessor.js';
import field from './field.js';

export const id: Accessor = field('id');

export const identity: Accessor<any, any> = accessor(_ => _, [], 'identity');

export const zero: Accessor<any, number> = accessor(() => 0, [], 'zero');

export const one: Accessor<any, number> = accessor(() => 1, [], 'one');

export const truthy: Accessor<any, boolean> = accessor(() => true, [], 'true');

export const falsy: Accessor<any, boolean> = accessor(() => false, [], 'false');
