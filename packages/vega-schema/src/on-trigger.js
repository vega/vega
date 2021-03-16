import { array, booleanType, def, object, oneOf } from './util';

// types defined elsewhere
const exprStringRef = def('exprString');

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
  onTrigger,
  onMarkTrigger
};
