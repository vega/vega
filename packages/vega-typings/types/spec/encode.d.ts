import { SignalRef } from '.';
import { AnchorValue } from './values';
import { TitleAnchor } from './title';

export type Field = string | SignalRef | DatumFieldRef | GroupFieldRef | ParentFieldRef;

export interface DatumFieldRef {
  datum: Field;
}
export interface GroupFieldRef {
  group: Field;
  level?: number;
}
export interface ParentFieldRef {
  parent: Field;
  level?: number;
}
export type BaseValueRef<T> =
  | SignalRef
  | {
      value: T | null;
    }
  | {
      field: Field;
    }
  | {
      range: number | boolean;
    };
export type ScaledValueRef<T> =
  | BaseValueRef<T>
  | (BaseValueRef<T> & {
      scale: Field;
    })
  | {
      scale: Field;
      band: boolean | number;
    };
export type NumericValueRef = (ScaledValueRef<number> | {}) & {
  exponent?: number | NumericValueRef;
  mult?: number | NumericValueRef;
  offset?: number | NumericValueRef;
  round?: boolean;
  extra?: boolean;
};
export type StringValueRef = ScaledValueRef<string>;
export type SymbolShapeValueRef = ScaledValueRef<SymbolShape>;
export type FontWeightValueRef = ScaledValueRef<FontWeight>;
export type AlignValueRef = ScaledValueRef<Align>;
export type AnchorValueRef = ScaledValueRef<TitleAnchor>;
export type TextBaselineValueRef = ScaledValueRef<TextBaseline>;
export type BooleanValueRef = ScaledValueRef<boolean>;
export type ArrayValueRef = ScaledValueRef<any[]>;
export type ArbitraryValueRef = NumericValueRef | ColorValueRef | ScaledValueRef<any>;
export interface ColorRGB {
  r: NumericValueRef;
  g: NumericValueRef;
  b: NumericValueRef;
}
export interface ColorHSL {
  h: NumericValueRef;
  s: NumericValueRef;
  l: NumericValueRef;
}
export interface ColorLAB {
  l: NumericValueRef;
  a: NumericValueRef;
  b: NumericValueRef;
}
export interface ColorHCL {
  h: NumericValueRef;
  c: NumericValueRef;
  l: NumericValueRef;
}
export type ColorValueRef =
  | ScaledValueRef<string>
  | {
      gradient: Field;
    }
  | {
      color: ColorRGB | ColorHSL | ColorLAB | ColorHCL;
    };
export type ProductionRule<T> =
  | T
  | ({
      test?: string;
    } & T)[];
export interface EncodeEntry {
  x?: ProductionRule<NumericValueRef>;
  x2?: ProductionRule<NumericValueRef>;
  xc?: ProductionRule<NumericValueRef>;
  width?: ProductionRule<NumericValueRef>;
  y?: ProductionRule<NumericValueRef>;
  y2?: ProductionRule<NumericValueRef>;
  yc?: ProductionRule<NumericValueRef>;
  height?: ProductionRule<NumericValueRef>;
  opacity?: ProductionRule<NumericValueRef>;
  fill?: ProductionRule<ColorValueRef>;
  fillOpacity?: ProductionRule<NumericValueRef>;
  stroke?: ProductionRule<ColorValueRef>;
  strokeWidth?: ProductionRule<NumericValueRef>;
  strokeOpacity?: ProductionRule<NumericValueRef>;
  strokeDash?: ProductionRule<ScaledValueRef<number[]>>;
  strokeDashOffset?: ProductionRule<NumericValueRef>;
  strokeCap?: ProductionRule<StringValueRef>;
  strokeJoin?: ProductionRule<StringValueRef>;
  strokeMiterLimit?: ProductionRule<NumericValueRef>;
  cursor?: ProductionRule<StringValueRef>;
  tooltip?: ProductionRule<StringValueRef>;
  [k: string]: ProductionRule<ArbitraryValueRef> | undefined;
}
export type Align = 'left' | 'center' | 'right';
export interface AlignProperty {
  align?: ProductionRule<ScaledValueRef<Align>>;
}
export interface DefinedProperty {
  defined?: ProductionRule<BooleanValueRef>;
}
export interface ThetaProperty {
  theta?: ProductionRule<NumericValueRef>;
}
export interface ArcEncodeEntry extends EncodeEntry {
  startAngle?: ProductionRule<NumericValueRef>;
  endAngle?: ProductionRule<NumericValueRef>;
  padAngle?: ProductionRule<NumericValueRef>;
  innerRadius?: ProductionRule<NumericValueRef>;
  outerRadius?: ProductionRule<NumericValueRef>;
  cornerRadius?: ProductionRule<NumericValueRef>;
}
export type Orientation = 'horizontal' | 'vertical';
export interface AreaEncodeEntry extends LineEncodeEntry {
  orient?: ProductionRule<ScaledValueRef<Orientation>>;
}
export interface GroupEncodeEntry extends RectEncodeEntry {
  clip?: ProductionRule<BooleanValueRef>;
}
export type Baseline = 'top' | 'middle' | 'bottom';
export interface ImageEncodeEntry extends EncodeEntry, AlignProperty {
  url?: ProductionRule<StringValueRef>;
  aspect?: ProductionRule<BooleanValueRef>;
  baseline?: ProductionRule<ScaledValueRef<Baseline>>;
}

/**
 * @TJS-type integer
 * @minimum 100
 * @maximum 900
 */
export type Interpolate =
  | 'basis'
  | 'basis-open'
  | 'basis-closed'
  | 'bundle'
  | 'cardinal'
  | 'cardinal-open'
  | 'cardinal-closed'
  | 'catmull-rom'
  | 'linear'
  | 'linear-closed'
  | 'monotone'
  | 'natural'
  | 'step'
  | 'step-before'
  | 'step-after';

export interface LineEncodeEntry extends EncodeEntry, DefinedProperty {
  interpolate?: ProductionRule<ScaledValueRef<Interpolate>>;
  tension?: ProductionRule<NumericValueRef>;
}
export interface PathEncodeEntry extends EncodeEntry {
  path?: ProductionRule<StringValueRef>;
}
export interface RectEncodeEntry extends EncodeEntry {
  cornerRadius?: ProductionRule<NumericValueRef>;
}
export type RuleEncodeEntry = EncodeEntry;
export interface ShapeEncodeEntry extends EncodeEntry {
  shape?: ProductionRule<StringValueRef>;
}
export type SymbolShape =
  | 'circle'
  | 'square'
  | 'cross'
  | 'diamond'
  | 'triangle-up'
  | 'triangle-down'
  | 'triangle-right'
  | 'triangle-left'
  | string;
export interface SymbolEncodeEntry extends EncodeEntry {
  size?: ProductionRule<NumericValueRef>;
  shape?: ProductionRule<ScaledValueRef<SymbolShape>>;
}
export type TextBaseline = 'alphabetic' | Baseline;
export type TextDirection = 'ltr' | 'rtl';
export type FontWeight =
  | 'normal'
  | 'bold'
  | 'lighter'
  | 'bolder'
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900;
export type FontStyle = 'normal' | 'italic';
export interface TextEncodeEntry extends EncodeEntry, AlignProperty, ThetaProperty {
  text?: ProductionRule<StringValueRef>;
  angle?: ProductionRule<NumericValueRef>;
  baseline?: ProductionRule<ScaledValueRef<TextBaseline>>;
  dir?: ProductionRule<ScaledValueRef<TextDirection>>;
  dx?: ProductionRule<NumericValueRef>;
  dy?: ProductionRule<NumericValueRef>;
  ellipsis?: ProductionRule<StringValueRef>;
  font?: ProductionRule<StringValueRef>;
  fontSize?: ProductionRule<NumericValueRef>;
  fontWeight?: ProductionRule<ScaledValueRef<FontWeight>>;
  fontStyle?: ProductionRule<ScaledValueRef<FontStyle>>;
  limit?: ProductionRule<NumericValueRef>;
  radius?: ProductionRule<NumericValueRef>;
}
export interface TrailEncodeEntry extends EncodeEntry, DefinedProperty, ThetaProperty {}
export interface Encodable<T> {
  encode?: Encode<T>;
}
export type Encode<T> = Partial<Record<EncodeEntryName, T>>;
export type EncodeEntryName =
  | 'enter'
  | 'update'
  | 'exit'
  | 'hover'
  | 'leave'
  | 'select'
  | 'release';
