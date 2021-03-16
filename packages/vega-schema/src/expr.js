import { object, stringType } from './util';

const expr = object({
  _expr_: stringType,
  as: stringType
}, undefined);

const exprString = stringType;

export default {
  expr,
  exprString
};
