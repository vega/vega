import accessor, { Accessor } from './accessor.js';
import field from './field.js';

export const id = field('id');

export const identity: Accessor = accessor(_ => _, [], 'identity');

export const zero: Accessor<number> = accessor(() => 0, [], 'zero');

export const one: Accessor<number> = accessor(() => 1, [], 'one');

export const truthy: Accessor<boolean> = accessor(() => true, [], 'true');

export const falsy: Accessor<boolean> = accessor(() => false, [], 'false');
