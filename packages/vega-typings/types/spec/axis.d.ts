import {
  GroupEncodeEntry,
  GuideEncodeEntry,
  TimeInterval,
  NumericValueRef,
  RuleEncodeEntry,
  SignalRef,
  TextEncodeEntry,
} from '.';
import { FontWeight, Align, TextBaseline, ArrayValueRef } from './encode';
import {
  NumberValue,
  StringValue,
  ColorValue,
  FontWeightValue,
  AlignValue,
  TextBaselineValue,
  SymbolShapeValue,
  BooleanValue,
  DashArrayValue,
} from './values';
import { LayoutAlign } from './layout';

export type AxisOrient = 'top' | 'bottom' | 'left' | 'right';

export type LabelOverlap = boolean | 'parity' | 'greedy';

export interface Axis extends BaseAxis {
  /**
   * The orientation of the axis. One of `"top"`, `"bottom"`, `"left"` or `"right"`. The orientation can be used to further specialize the axis type (e.g., a y axis oriented for the right edge of the chart).
   *
   * __Default value:__ `"bottom"` for x-axes and `"left"` for y-axes.
   */
  orient: AxisOrient;

  /**
   * The name of the scale backing the axis component.
   */
  scale: string;

  /**
   * The name of the scale to use for including grid lines. By default grid lines are driven by the same scale as the ticks and labels.
   */
  gridScale?: string;

  /**
   * The format specifier pattern for axis labels. For numerical values, must be a legal [d3-format](https://github.com/d3/d3-format#locale_format) specifier. For date-time values, must be a legal [d3-time-format](https://github.com/d3/d3-time-format#locale_format) specifier.
   */
  format?: string | SignalRef;

  /**
   * A title for the axis (none by default).
   */
  title?: StringValue;

  /**
   * The orthogonal offset in pixels by which to displace the axis from its position along the edge of the chart.
   */
  offset?: NumberValue;

  /**
   * The anchor position of the axis in pixels. For x-axes with top or bottom orientation, this sets the axis group x coordinate. For y-axes with left or right orientation, this sets the axis group y coordinate.
   *
   * __Default value__: `0`
   */
  position?: NumberValue;

  /**
   * A desired number of ticks, for axes visualizing quantitative scales. The resulting number may be different so that values are "nice" (multiples of `2`, `5`, `10`) and lie within the underlying scale's range.
   *
   * For scales of type `"time"` or `"utc"`, the tick count can instead be a time interval specifier. Legal string values are `"millisecond"`, `"second"`, `"minute"`, `"hour"`, `"day"`, `"week"`, `"month"`, and "year". Alternatively, an object-valued interval specifier of the form `{"interval": "month", "step": 3}` includes a desired number of interval steps. Here, ticks are generated for each quarter (Jan, Apr, Jul, Oct) boundary.
   *
   * @minimum 0
   */
  tickCount?: number | TimeInterval | SignalRef;

  /**
   * Explicitly set the visible axis tick and label values.
   */
  values?: any[] | SignalRef;

  /**
   * The integer z-index indicating the layering of the legend group relative to other axis, mark, and legend groups.
   *
   * @TJS-type integer
   * @minimum 0
   */
  zindex?: number;

  /**
   * Mark definitions for custom axis encoding.
   */
  encode?: AxisEncode;
}

export interface AxisEncode {
  /**
   * Custom encoding for the axis container.
   */
  axis?: GuideEncodeEntry<GroupEncodeEntry>;
  /**
   * Custom encoding for axis tick rule marks.
   */
  ticks?: GuideEncodeEntry<GroupEncodeEntry>;
  /**
   * Custom encoding for axis label text marks.
   */
  labels?: GuideEncodeEntry<TextEncodeEntry>;
  /**
   * Custom encoding for the axis title text mark.
   */
  title?: GuideEncodeEntry<TextEncodeEntry>;
  /**
   * Custom encoding for axis gridline rule marks.
   */
  grid?: GuideEncodeEntry<RuleEncodeEntry>;
  /**
   * Custom encoding for the axis domain rule mark.
   */
  domain?: GuideEncodeEntry<RuleEncodeEntry>;
}

export interface BaseAxis<
  N = NumberValue,
  NS = number | SignalRef,
  B = BooleanValue,
  BNS = number | boolean | SignalRef,
  S = StringValue,
  C = ColorValue,
  FW = FontWeightValue,
  A = AlignValue,
  TB = TextBaselineValue,
  LA = LayoutAlign | SignalRef,
  LO = LabelOverlap | SignalRef,
  DA = DashArrayValue
> {
  /**
   * The minimum extent in pixels that axis ticks and labels should use. This determines a minimum offset value for axis titles.
   *
   * __Default value:__ `30` for y-axis; `undefined` for x-axis.
   */
  minExtent?: N;

  /**
   * The maximum extent in pixels that axis ticks and labels should use. This determines a maximum offset value for axis titles.
   *
   * __Default value:__ `undefined`.
   */
  maxExtent?: N;

  /**
   * An interpolation fraction indicating where, for `band` scales, axis ticks should be positioned. A value of `0` places ticks at the left edge of their bands. A value of `0.5` places ticks in the middle of their bands.
   *
   *  __Default value:__ `0.5`
   */
  bandPosition?: N;

  // ---------- Title ----------
  /**
   * The padding, in pixels, between title and axis.
   */
  titlePadding?: N;

  /**
   * Horizontal text alignment of axis titles.
   */
  titleAlign?: A;

  /**
   * Angle in degrees of axis titles.
   */
  titleAngle?: N;

  /**
   * X-coordinate of the axis title relative to the axis group.
   */
  titleX?: N;

  /**
   * Y-coordinate of the axis title relative to the axis group.
   */
  titleY?: N;

  /**
   * Vertical text baseline for axis titles.
   */
  titleBaseline?: TB;

  /**
   * Color of the title, can be in hex color code or regular color name.
   */
  titleColor?: C;

  /**
   * Font of the title. (e.g., `"Helvetica Neue"`).
   */
  titleFont?: S;

  /**
   * Font size of the title.
   *
   * @minimum 0
   */
  titleFontSize?: N;

  /**
   * Font weight of the title.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  titleFontWeight?: FW;

  /**
   * Maximum allowed pixel width of axis titles.
   *
   * @minimum 0
   */
  titleLimit?: N;

  /**
   * Opacity of the axis title.
   */
  titleOpacity?: N;

  // ---------- Domain ----------
  /**
   * A boolean flag indicating if the domain (the axis baseline) should be included as part of the axis.
   *
   * __Default value:__ `true`
   */
  domain?: boolean;

  /**
   * Color of axis domain line.
   *
   * __Default value:__ `"gray"`.
   */
  domainColor?: C;

  /**
   * Opacity of the axis domain line.
   */
  domainOpacity?: N;

  /**
   * Stroke width of axis domain line
   *
   * __Default value:__ `1`
   */
  domainWidth?: N;

  // ---------- Ticks ----------
  /**
   * Boolean value that determines whether the axis should include ticks.
   *
   * __Default value:__ `true`
   */
  ticks?: B;

  /**
   * The color of the axis's tick.
   *
   * __Default value:__ `"gray"`
   */
  tickColor?: C;

  /**
   * Boolean flag indicating if an extra axis tick should be added for the initial position of the axis. This flag is useful for styling axes for `band` scales such that ticks are placed on band boundaries rather in the middle of a band. Use in conjunction with `"bandPostion": 1` and an axis `"padding"` value of `0`.
   */
  tickExtra?: B;

  /**
   * Position offset in pixels to apply to ticks, labels, and gridlines.
   */
  tickOffset?: N;

  /**
   * Opacity of the ticks.
   */
  tickOpacity?: N;

  /**
   * Boolean flag indicating if pixel position values should be rounded to the nearest integer.
   *
   * __Default value:__ `true`
   */
  tickRound?: B;

  /**
   * The size in pixels of axis ticks.
   *
   * __Default value:__ `5`
   * @minimum 0
   */
  tickSize?: N;

  /**
   * The width, in pixels, of ticks.
   *
   * __Default value:__ `1`
   * @minimum 0
   */
  tickWidth?: N;

  // ---------- Grid ----------
  /**
   * A boolean flag indicating if grid lines should be included as part of the axis.
   */
  grid?: boolean;

  /**
   * Color of gridlines.
   *
   * __Default value:__ `"lightGray"`.
   */
  gridColor?: C;

  /**
   * The offset (in pixels) into which to begin drawing with the grid dash array.
   */
  gridDash?: DA;

  /**
   * The stroke opacity of grid (value between [0,1])
   *
   * __Default value:__ `1`
   * @minimum 0
   * @maximum 1
   */
  gridOpacity?: N;

  /**
   * The grid width, in pixels.
   *
   * __Default value:__ `1`
   * @minimum 0
   */
  gridWidth?: N;

  // ---------- Labels ----------
  /**
   * A boolean flag indicating if labels should be included as part of the axis.
   *
   * __Default value:__ `true`.
   */
  labels?: boolean;

  /**
   * Horizontal text alignment of axis tick labels, overriding the default setting for the current axis orientation.
   */
  labelAlign?: A;

  /**
   * Vertical text baseline of axis tick labels, overriding the default setting for the current axis orientation. Can be `"top"`, `"middle"`, `"bottom"`, or `"alphabetic"`.
   */
  labelBaseline?: TB;

  /**
   * Indicates if labels should be hidden if they exceed the axis range. If `false` (the default) no bounds overlap analysis is performed. If `true`, labels will be hidden if they exceed the axis range by more than 1 pixel. If this property is a number, it specifies the pixel tolerance: the maximum amount by which a label bounding box may exceed the axis range.
   *
   * __Default value:__ `false`.
   */
  labelBound?: BNS;

  /**
   * Indicates if the first and last axis labels should be aligned flush with the scale range. Flush alignment for a horizontal axis will left-align the first label and right-align the last label. For vertical axes, bottom and top text baselines are applied instead. If this property is a number, it also indicates the number of pixels by which to offset the first and last labels; for example, a value of 2 will flush-align the first and last labels and also push them 2 pixels outward from the center of the axis. The additional adjustment can sometimes help the labels better visually group with corresponding axis ticks.
   */
  labelFlush?: BNS;

  /**
   * Indicates the number of pixels by which to offset flush-adjusted labels. For example, a value of `2` will push flush-adjusted labels 2 pixels outward from the center of the axis. Offsets can help the labels better visually group with corresponding axis ticks.
   *
   * __Default value:__ `0`.
   */
  labelFlushOffset?: NS;

  /**
   * The strategy to use for resolving overlap of axis labels. If `false` (the default), no overlap reduction is attempted. If set to `true` or `"parity"`, a strategy of removing every other label is used (this works well for standard linear axes). If set to `"greedy"`, a linear scan of the labels is performed, removing any labels that overlaps with the last visible label (this often works better for log-scaled axes).
   */
  labelOverlap?: LO;

  /**
   * The rotation angle of the axis labels.
   *
   * __Default value:__ `-90` for nominal and ordinal fields; `0` otherwise.
   *
   * @minimum -360
   * @maximum 360
   */
  labelAngle?: N;

  /**
   * The color of the tick label, can be in hex color code or regular color name.
   */
  labelColor?: C;

  /**
   * The font of the tick label.
   */
  labelFont?: S;

  /**
   * The font size of the label, in pixels.
   *
   * @minimum 0
   */
  labelFontSize?: N;

  /**
   * Font weight of axis tick labels.
   */
  labelFontWeight?: FW;

  /**
   * Maximum allowed pixel width of axis tick labels.
   *
   * __Default value:__ `180`
   */
  labelLimit?: N;

  /**
   * The opacity of the labels.
   */
  labelOpacity?: N;

  /**
   * The padding, in pixels, between axis and text labels.
   *
   * __Default value:__ `2`
   */

  labelPadding?: N;
}
