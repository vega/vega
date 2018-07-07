import {
  Align,
  AlignValueRef,
  ArrayValueRef,
  BooleanValueRef,
  ColorValueRef,
  FontWeight,
  FontWeightValueRef,
  NumericValueRef,
  StringValueRef,
  SymbolShape,
  SymbolShapeValueRef,
  TextBaseline,
  TextBaselineValueRef,
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
