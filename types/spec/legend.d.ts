import {
  GroupEncodeEntry,
  NumericValueRef,
  RectEncodeEntry,
  SignalRef,
  SymbolEncodeEntry,
  TextEncodeEntry,
  Orientation,
} from '.';

export interface GuideEncodeEntry<T> {
  name?: string;
  interactive?: boolean;
  enter?: T;
  update?: T;
  exit?: T;
  hover?: T;
}
export type LegendType = 'gradient' | 'symbol';
export type LegendOrient =
  | 'none'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type Color = string;

export interface BaseLegend {
  name?: string;
  type?: LegendType;
  direction?: Orientation;
  /**
   * The orientation of the legend, which determines how the legend is positioned within the scene. One of "left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "none".
   *
   * __Default value:__ `"right"`
   */
  orient?: LegendOrient;
  gridAlign?: 'all' | 'each' | 'none';
  clipHeight?: number | SignalRef;
  columns?: number | SignalRef;
  columnPadding?: number | SignalRef;
  rowPadding?: number | SignalRef;
  cornerRadius?: number | SignalRef;
  fillColor?: Color | SignalRef;
  strokeColor?: Color | SignalRef;
  strokeWidth?: number | SignalRef;
  gradientLength?: number | SignalRef;
  gradientThickness?: number | SignalRef;
  gradientStrokeColor?: Color | SignalRef;
  gradientStrokeWidth?: number | SignalRef;
  labelAlign?: string | SignalRef;
  labelBaseline?: string | SignalRef;
  labelColor?: Color | SignalRef;
  labelFont?: string | SignalRef;
  labelFontSize?: number | SignalRef;
  labelFontWeight?: string | number | SignalRef;
  labelLimit?: number | SignalRef;
  labelOffset?: number | SignalRef;
  labelOverlap?: boolean | string | SignalRef;
  symbolFillColor?: Color | SignalRef;
  symbolOffset?: number | SignalRef;
  symbolSize?: number | SignalRef;
  symbolStrokeColor?: Color | SignalRef;
  symbolStrokeWidth?: number | SignalRef;
  symbolType?: string | SignalRef;
  titleAlign?: string | SignalRef;
  titleBaseline?: string | SignalRef;
  titleColor?: Color | SignalRef;
  titleFont?: string | SignalRef;
  titleFontSize?: number | SignalRef;
  titleFontWeight?: string | number | SignalRef;
  titleLimit?: number | SignalRef;
  title?: string | SignalRef;
  zindex?: number;

  /**
   * The offset, in pixels, by which to displace the legend from the edge of the enclosing group or data rectangle.
   *
   * __Default value:__  `0`
   */
  offset?: number | NumericValueRef;
  /**
   * The padding, in pixels, between the legend and axis.
   */
  padding?: number | NumericValueRef;
  titlePadding?: number | NumericValueRef;
  /**
   * Padding (in pixels) between legend entries in a symbol legend.
   */
  entryPadding?: number | NumericValueRef;
  tickCount?: number | SignalRef;
  format?: string | SignalRef;
  values?: any[] | SignalRef;
  encode?: {
    title?: GuideEncodeEntry<GroupEncodeEntry>;
    labels?: GuideEncodeEntry<TextEncodeEntry>;
    legend?: GuideEncodeEntry<TextEncodeEntry>;
    symbols?: GuideEncodeEntry<SymbolEncodeEntry>;
    gradient?: GuideEncodeEntry<RectEncodeEntry>;
  };
}

export interface SizeLegend extends BaseLegend {
  size: string;
}
export interface ShapeLegend extends BaseLegend {
  shape: string;
}
export interface FillLegend extends BaseLegend {
  fill: string;
}
export interface StrokeLegend extends BaseLegend {
  stroke: string;
}
export interface StrokeDashLegend extends BaseLegend {
  strokeDash: string;
}
export interface OpacityLegend extends BaseLegend {
  opacity: string;
}
export type Legend =
  | SizeLegend
  | ShapeLegend
  | FillLegend
  | StrokeLegend
  | StrokeDashLegend
  | OpacityLegend;
