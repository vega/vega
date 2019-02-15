import accessor from './accessor';
import field from './field';

var empty: string[] = [];

export var id = field('id');

export var identity = accessor(function(_: unknown) { return _; }, empty, 'identity') as <V>(v: V) => V;

export var zero = accessor<0>(function() { return 0; }, empty, 'zero');

export var one = accessor<1>(function() { return 1; }, empty, 'one');

export var truthy = accessor<true>(function() { return true; }, empty, 'true');

export var falsy = accessor<false>(function() { return false; }, empty, 'false');
