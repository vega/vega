import {
  GroupEncodeEntry,
  Orientation,
  RectEncodeEntry,
  SignalRef,
  SymbolEncodeEntry,
  TextEncodeEntry,
} from '.';
import { FontWeight, SymbolShape } from './encode';
import { WithSignal } from './signal';
import { Omit } from './util';

export interface GuideEncodeEntry<T> {
  name?: string;
  interactive?: boolean;
  style?: string | string[];
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

export type LegendDirection = 'vertical' | 'horizontal';

export interface Legend extends WithSignal<Omit<BaseLegend, 'orient'>>, Pick<BaseLegend, 'orient'> {
  size?: string;
  shape?: string;
  fill?: string;
  stroke?: string;
  strokeDash?: string;
  opacity?: string;

  /**
   * The type of legend to include. One of `"symbol"` for discrete symbol legends, or `"gradient"` for a continuous color gradient. If gradient is used only the fill or stroke scale parameters are considered. If unspecified, the type will be inferred based on the scale parameters used and their backing scale types.
   */
  type?: LegendType;

  /**
   * The direction of the legend, one of `"vertical"` (default) or `"horizontal"`.
   *
   * __Default value:__ `"vertical"`
   */
  direction?: LegendDirection;

  /**
   * The format specifier pattern for legend labels. For numerical values, must be a legal [d3-format](https://github.com/d3/d3-format#locale_format) specifier. For date-time values, must be a legal [d3-time-format](https://github.com/d3/d3-time-format#locale_format) specifier.
   */
  format?: string | SignalRef;

  /**
   * The title for the legend.
   */
  title?: string | SignalRef;

  /**
   * The desired number of tick values for quantitative legends.
   */
  tickCount?: number | SignalRef;

  /**
   * Explicitly set the visible legend values.
   */
  values?: any[] | SignalRef;

  /**
   * The integer z-index indicating the layering of the legend group relative to other axis, mark and legend groups.
   *
   * @TJS-type integer
   * @minimum 0
   */
  zindex?: number;

  /**
   * Mark definitions for custom legend encoding.
   */
  encode?: LegendEncode;
}

export interface LegendEncode {
  title?: GuideEncodeEntry<GroupEncodeEntry>;
  labels?: GuideEncodeEntry<TextEncodeEntry>;
  legend?: GuideEncodeEntry<TextEncodeEntry>;
  symbols?: GuideEncodeEntry<SymbolEncodeEntry>;
  gradient?: GuideEncodeEntry<RectEncodeEntry>;
}

/**
 * Properties shared between legends and legend configs. Without signals so we can use it in Vega-Lite.
 */
export interface BaseLegend {
  /**
   * The orientation of the legend, which determines how the legend is positioned within the scene. One of "left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "none".
   *
   * __Default value:__ `"right"`
   */
  orient?: LegendOrient;

  // ---------- Legend Group ----------
  /**
   * Corner radius for the full legend.
   */
  cornerRadius?: number;

  /**
   * Background fill color for the full legend.
   */
  fillColor?: string;

  /**
   * The offset in pixels by which to displace the legend from the data rectangle and axes.
   *
   * __Default value:__ `18`.
   */
  offset?: number;

  /**
   * The padding between the border and content of the legend group.
   *
   * __Default value:__ `0`.
   */
  padding?: number;

  /**
   * Border stroke color for the full legend.
   */
  strokeColor?: string;

  /**
   * Border stroke width for the full legend.
   */
  strokeWidth?: number;

  // ---------- Title ----------
  /**
   * Horizontal text alignment for legend titles.
   *
   * __Default value:__ `"left"`.
   */
  titleAlign?: string;

  /**
   * Vertical text baseline for legend titles.
   *
   * __Default value:__ `"top"`.
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
   *
   * __Default value:__ `180`.
   * @minimum 0
   */
  titleLimit?: number;

  /**
   * The padding, in pixels, between title and legend.
   *
   * __Default value:__ `5`.
   */
  titlePadding?: number;

  // ---------- Gradient ----------

  /**
   * The length in pixels of the primary axis of a color gradient. This value corresponds to the height of a vertical gradient or the width of a horizontal gradient.
   *
   * __Default value:__ `200`.
   * @minimum 0
   */
  gradientLength?: number;

  /**
   * The thickness in pixels of the color gradient. This value corresponds to the width of a vertical gradient or the height of a horizontal gradient.
   *
   * __Default value:__ `16`.
   * @minimum 0
   */
  gradientThickness?: number;

  /**
   * The color of the gradient stroke, can be in hex color code or regular color name.
   *
   * __Default value:__ `"lightGray"`.
   */
  gradientStrokeColor?: string;

  /**
   * The width of the gradient stroke, in pixels.
   *
   * __Default value:__ `0`.
   * @minimum 0
   */
  gradientStrokeWidth?: number;

  // ---------- Symbol Layout ----------
  /**
   * The height in pixels to clip symbol legend entries and limit their size.
   */
  clipHeight?: number;

  /**
   * The number of columns in which to arrange symbol legend entries. A value of `0` or lower indicates a single row with one column per entry.
   */
  columns?: number;

  /**
   * The horizontal padding in pixels between symbol legend entries.
   *
   * __Default value:__ `10`.
   */
  columnPadding?: number;

  /**
   * The vertical padding in pixels between symbol legend entries.
   *
   * __Default value:__ `2`.
   */
  rowPadding?: number;

  /**
   * The alignment to apply to symbol legends rows and columns. The supported string values are `"all"`, `"each"` (the default), and `none`. For more information, see the [grid layout documentation](https://vega.github.io/vega/docs/layout).
   *
   * __Default value:__ `"each"`.
   */
  gridAlign?: 'all' | 'each' | 'none';

  // ---------- Symbols ----------
  /**
   * The color of the legend symbol,
   */
  symbolFillColor?: string;

  /**
   * The size of the legend symbol, in pixels.
   *
   * __Default value:__ `100`.
   * @minimum 0
   */
  symbolSize?: number;

  /**
   * Stroke color for legend symbols.
   */
  symbolStrokeColor?: string;

  /**
   * The width of the symbol's stroke.
   *
   * __Default value:__ `1.5`.
   * @minimum 0
   */
  symbolStrokeWidth?: number;

  /**
   * Default shape type (such as "circle") for legend symbols.
   *
   * __Default value:__ `"circle"`.
   */
  symbolType?: SymbolShape;

  // ---------- Label ----------
  /**
   * The alignment of the legend label, can be left, middle or right.
   */
  labelAlign?: string;

  /**
   * The position of the baseline of legend label, can be top, middle or bottom.
   *
   * __Default value:__ `"middle"`.
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
   * The font weight of legend label.
   */
  labelFontWeight?: FontWeight;

  /**
   * Maximum allowed pixel width of axis tick labels.
   *
   * __Default value:__ `160`.
   */
  labelLimit?: number;

  /**
   * The offset of the legend label.
   * @minimum 0
   *
   * __Default value:__ `4`.
   */
  labelOffset?: number;

  /**
   * The strategy to use for resolving overlap of labels in gradient legends. If `false`, no overlap reduction is attempted. If set to `true` (default) or `"parity"`, a strategy of removing every other label is used. If set to `"greedy"`, a linear scan of the labels is performed, removing any label that overlaps with the last visible label (this often works better for log-scaled axes).
   *
   * __Default value:__ `true`.
   */
  labelOverlap?: boolean | 'parity' | 'greedy';
}
