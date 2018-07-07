import {
  NumericValueRef,
  FontWeight,
  StringValueRef,
  FontWeightValueRef,
  ColorValueRef,
  AlignProperty,
  Align,
  AlignValueRef,
  TextBaselineValueRef,
  SymbolShape,
  SymbolShapeValueRef,
  Baseline,
  TextBaseline,
  BooleanValueRef,
  ArrayValueRef,
} from './encode';

export type NumberValue = number | NumericValueRef;

export type FontWeightValue = FontWeight | FontWeightValueRef;

export type StringValue = string | StringValueRef;

export type ColorValue = null | string | ColorValueRef;

export type AlignValue = Align | AlignValueRef;

export type TextBaselineValue = TextBaseline | TextBaselineValueRef;

export type SymbolShapeValue = SymbolShape | SymbolShapeValueRef;

export type BooleanValue = boolean | BooleanValueRef;

export type DashArrayValue = number[] | ArrayValueRef;
