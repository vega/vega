import accessor from './accessor';
import field from './field';

export const id = field('id');

export const identity = accessor(_ => _, [], 'identity');

export const zero = accessor(() => 0, [], 'zero');

export const one = accessor(() => 1, [], 'one');

export const truthy = accessor(() => true, [], 'true');

export const falsy = accessor(() => false, [], 'false');
