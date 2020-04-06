import accessor from './accessor';
import field from './field';

const empty = [];

export const id = field('id');

export const identity = accessor(
  function (_) {
    return _;
  },
  empty,
  'identity'
);

export const zero = accessor(
  function () {
    return 0;
  },
  empty,
  'zero'
);

export const one = accessor(
  function () {
    return 1;
  },
  empty,
  'one'
);

export const truthy = accessor(
  function () {
    return true;
  },
  empty,
  'true'
);

export const falsy = accessor(
  function () {
    return false;
  },
  empty,
  'false'
);
