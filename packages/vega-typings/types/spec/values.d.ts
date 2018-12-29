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
  AnchorValueRef,
} from './encode';
import { TitleAnchor } from './title';

export type NumberValue = number | NumericValueRef;

export type FontWeightValue = FontWeight | FontWeightValueRef;

export type StringValue = string | StringValueRef;

export type ColorValue = null | string | ColorValueRef;

export type AlignValue = Align | AlignValueRef;

export type TextBaselineValue = TextBaseline | TextBaselineValueRef;

export type SymbolShapeValue = SymbolShape | SymbolShapeValueRef;

export type BooleanValue = boolean | BooleanValueRef;

export type DashArrayValue = number[] | ArrayValueRef;

export type AnchorValue = TitleAnchor | AnchorValueRef;
