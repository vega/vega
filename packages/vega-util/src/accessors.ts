import accessor, { Accessor } from './accessor.js';
import field from './field.js';

export const id: Accessor = field('id');

export const identity: Accessor<unknown, unknown> = accessor(_ => _, [], 'identity');

export const zero: Accessor<unknown, number> = accessor(() => 0, [], 'zero');

export const one: Accessor<unknown, number> = accessor(() => 1, [], 'one');

export const truthy: Accessor<unknown, boolean> = accessor(() => true, [], 'true');

export const falsy: Accessor<unknown, boolean> = accessor(() => false, [], 'false');
