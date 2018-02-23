import {
  GroupEncodeEntry,
  NumericValueRef,
  RectEncodeEntry,
  SymbolEncodeEntry,
  TextEncodeEntry,
  FontWeight,
} from './encode';
import { SignalRef } from './signal';
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
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
export interface BaseLegend {
  name?: string;
  type?: LegendType;
  orient?: LegendOrient;
  title?: string | SignalRef;
  zindex?: number;
  interactive?: boolean;
  offset?: number | NumericValueRef;
  padding?: number | NumericValueRef;
  titlePadding?: number | NumericValueRef;
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

export interface VgLegendBase {
  /**
   * Padding (in pixels) between legend entries in a symbol legend.
   */
  entryPadding?: number;

  /**
   * The orientation of the legend, which determines how the legend is positioned within the scene. One of "left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "none".
   *
   * __Default value:__ `"right"`
   */
  orient?: LegendOrient;

  /**
   * The offset, in pixels, by which to displace the legend from the edge of the enclosing group or data rectangle.
   *
   * __Default value:__  `0`
   */
  offset?: number;

  /**
   * The padding, in pixels, between the legend and axis.
   */
  padding?: number;
}

export interface VgLegendConfig extends VgLegendBase {
  /**
   * Corner radius for the full legend.
   */
  cornerRadius?: number;

  /**
   * Background fill color for the full legend.
   */
  fillColor?: string;

  /**
   * Border stroke color for the full legend.
   */
  strokeColor?: string;

  /**
   * Border stroke dash pattern for the full legend.
   */
  strokeDash?: number[];

  /**
   * Border stroke width for the full legend.
   */
  strokeWidth?: number;
  // ---------- Gradient ----------
  /**
   * The color of the gradient stroke, can be in hex color code or regular color name.
   */
  gradientStrokeColor?: string;

  /**
   * The width of the gradient stroke, in pixels.
   * @minimum 0
   */
  gradientStrokeWidth?: number;

  /**
   * The height of the gradient, in pixels.
   * @minimum 0
   */
  gradientHeight?: number;

  /**
   * Text baseline for color ramp gradient labels.
   */
  gradientLabelBaseline?: string;

  /**
   * The maximum allowed length in pixels of color ramp gradient labels.
   */
  gradientLabelLimit?: number;

  /**
   * Vertical offset in pixels for color ramp gradient labels.
   */
  gradientLabelOffset?: number;

  /**
   * The width of the gradient, in pixels.
   * @minimum 0
   */
  gradientWidth?: number;

  // ---------- Label ----------
  /**
   * The alignment of the legend label, can be left, middle or right.
   */
  labelAlign?: string;

  /**
   * The position of the baseline of legend label, can be top, middle or bottom.
   */
  labelBaseline?: string;

  /**
   * The color of the legend label, can be in hex color code or regular color name.
   */
  labelColor?: string;

  /**
   * The font of the legend label.
   */
  labelFont?: string;

  /**
   * The font size of legend label.
   *
   * __Default value:__ `10`.
   *
   * @minimum 0
   */
  labelFontSize?: number;

  /**
   * Maximum allowed pixel width of axis tick labels.
   */
  labelLimit?: number;

  /**
   * The offset of the legend label.
   * @minimum 0
   */
  labelOffset?: number;

  // ---------- Symbols ----------
  /**
   * The color of the legend symbol,
   */
  symbolColor?: string;

  /**
   * Default shape type (such as "circle") for legend symbols.
   */
  symbolType?: string;

  /**
   * The size of the legend symbol, in pixels.
   * @minimum 0
   */
  symbolSize?: number;

  /**
   * The width of the symbol's stroke.
   * @minimum 0
   */
  symbolStrokeWidth?: number;

  // ---------- Title ----------
  /**
   * Horizontal text alignment for legend titles.
   */
  titleAlign?: string;

  /**
   * Vertical text baseline for legend titles.
   */
  titleBaseline?: string;
  /**
   * The color of the legend title, can be in hex color code or regular color name.
   */
  titleColor?: string;

  /**
   * The font of the legend title.
   */
  titleFont?: string;

  /**
   * The font size of the legend title.
   */
  titleFontSize?: number;

  /**
   * The font weight of the legend title.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  titleFontWeight?: FontWeight;

  /**
   * Maximum allowed pixel width of axis titles.
   */
  titleLimit?: number;

  /**
   * The padding, in pixels, between title and legend.
   */
  titlePadding?: number;
}
