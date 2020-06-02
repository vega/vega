import accessor from './accessor';
import field from './field';

export const id = field('id');

export const identity = accessor(function(_) { return _; }, [], 'identity');

export const zero = accessor(function() { return 0; }, [], 'zero');

export const one = accessor(function() { return 1; }, [], 'one');

export const truthy = accessor(function() { return true; }, [], 'true');

export const falsy = accessor(function() { return false; }, [], 'false');
