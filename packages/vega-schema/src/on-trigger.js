import { array, object, oneOf, ref, booleanType } from './util';

// ???
const exprStringRef = ref('exprString');

const onTrigger = array(object({
  _trigger_: exprStringRef,
  insert: exprStringRef,
  remove: oneOf(booleanType, exprStringRef),
  toggle: exprStringRef,
  modify: exprStringRef,
  values: exprStringRef
}));

const onMarkTrigger = array(object({
  _trigger_: exprStringRef,
  modify: exprStringRef,
  values: exprStringRef
}));

export default {
  defs: {
    onTrigger,
    onMarkTrigger
  }
};
