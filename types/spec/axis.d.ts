import {
  GroupEncodeEntry,
  NumericValueRef,
  RuleEncodeEntry,
  TextEncodeEntry,
  FontWeight,
} from './encode';
import { GuideEncodeEntry } from './legend';
import { SignalRef } from './signal';
export type AxisOrient = 'top' | 'bottom' | 'left' | 'right';
export interface Axis {
  orient: AxisOrient;
  scale: string;
  name?: string;
  title?: string | SignalRef;
  zindex?: number;
  interactive?: boolean;
  ticks?: boolean;
  labels?: boolean;
  domain?: boolean;
  grid?: boolean;
  gridScale?: string;
  tickSize?: number;
  labelPadding?: number;
  tickCount?: number | SignalRef;
  format?: string | SignalRef;
  values?: any[] | SignalRef;
  offset?: number | NumericValueRef;
  position?: number | NumericValueRef;
  titlePadding?: number | NumericValueRef;
  minExtent?: number | NumericValueRef;
  maxExtent?: number | NumericValueRef;
  encode?: {
    ticks?: GuideEncodeEntry<GroupEncodeEntry>;
    labels?: GuideEncodeEntry<TextEncodeEntry>;
    title?: GuideEncodeEntry<TextEncodeEntry>;
    grid?: GuideEncodeEntry<RuleEncodeEntry>;
    domain?: GuideEncodeEntry<RuleEncodeEntry>;
  };
}

/**
 * Base object for Vega's Axis and Axis Config.
 * All of these properties are both properties of Vega's Axis and Axis Config.
 */
export interface VgAxisBase {
  /**
   * A boolean flag indicating if the domain (the axis baseline) should be included as part of the axis.
   *
   * __Default value:__ `true`
   */
  domain?: boolean;

  /**
   * A boolean flag indicating if grid lines should be included as part of the axis
   *
   * __Default value:__ `true` for [continuous scales](scale.html#continuous) that are not binned; otherwise, `false`.
   */
  grid?: boolean;

  /**
   * A boolean flag indicating if labels should be included as part of the axis.
   *
   * __Default value:__  `true`.
   */
  labels?: boolean;

  /**
   * Indicates if labels should be hidden if they exceed the axis range. If `false `(the default) no bounds overlap analysis is performed. If `true`, labels will be hidden if they exceed the axis range by more than 1 pixel. If this property is a number, it specifies the pixel tolerance: the maximum amount by which a label bounding box may exceed the axis range.
   *
   * __Default value:__ `false`.
   */
  labelBound?: boolean | number;

  /**
   * Indicates if the first and last axis labels should be aligned flush with the scale range. Flush alignment for a horizontal axis will left-align the first label and right-align the last label. For vertical axes, bottom and top text baselines are applied instead. If this property is a number, it also indicates the number of pixels by which to offset the first and last labels; for example, a value of 2 will flush-align the first and last labels and also push them 2 pixels outward from the center of the axis. The additional adjustment can sometimes help the labels better visually group with corresponding axis ticks.
   *
   * __Default value:__ `true` for axis of a continuous x-scale. Otherwise, `false`.
   */
  labelFlush?: boolean | number;

  /**
   * The strategy to use for resolving overlap of axis labels. If `false` (the default), no overlap reduction is attempted. If set to `true` or `"parity"`, a strategy of removing every other label is used (this works well for standard linear axes). If set to `"greedy"`, a linear scan of the labels is performed, removing any labels that overlaps with the last visible label (this often works better for log-scaled axes).
   *
   * __Default value:__ `true` for non-nominal fields with non-log scales; `"greedy"` for log scales; otherwise `false`.
   */
  labelOverlap?: boolean | 'parity' | 'greedy';

  /**
   * The padding, in pixels, between axis and text labels.
   */
  labelPadding?: number;

  /**
   * Boolean value that determines whether the axis should include ticks.
   */
  ticks?: boolean;

  /**
   * The size in pixels of axis ticks.
   *
   * @minimum 0
   */
  tickSize?: number;

  /**
   * Max length for axis title if the title is automatically generated from the field's description.
   *
   * @minimum 0
   * __Default value:__ `undefined`.
   */
  titleMaxLength?: number;

  /**
   * The padding, in pixels, between title and axis.
   */
  titlePadding?: number;

  /**
   * The minimum extent in pixels that axis ticks and labels should use. This determines a minimum offset value for axis titles.
   *
   * __Default value:__ `30` for y-axis; `undefined` for x-axis.
   */
  minExtent?: number;

  /**
   * The maximum extent in pixels that axis ticks and labels should use. This determines a maximum offset value for axis titles.
   *
   * __Default value:__ `undefined`.
   */
  maxExtent?: number;
}

export interface VgAxisConfig extends VgAxisBase {
  /**
   * An interpolation fraction indicating where, for `band` scales, axis ticks should be positioned. A value of `0` places ticks at the left edge of their bands. A value of `0.5` places ticks in the middle of their bands.
   */
  bandPosition?: number;
  /**
   * Stroke width of axis domain line
   *
   * __Default value:__  (none, using Vega default).
   */
  domainWidth?: number;

  /**
   * Color of axis domain line.
   *
   * __Default value:__  (none, using Vega default).
   */
  domainColor?: string;

  // ---------- Grid ----------
  /**
   * Color of gridlines.
   */
  gridColor?: string;

  /**
   * The offset (in pixels) into which to begin drawing with the grid dash array.
   */
  gridDash?: number[];

  /**
   * The stroke opacity of grid (value between [0,1])
   *
   * __Default value:__ (`1` by default)
   * @minimum 0
   * @maximum 1
   */
  gridOpacity?: number;

  /**
   * The grid width, in pixels.
   * @minimum 0
   */
  gridWidth?: number;

  // ---------- Ticks ----------
  /**
   * The color of the axis's tick.
   */
  tickColor?: string;

  /**
   * The rotation angle of the axis labels.
   *
   * __Default value:__ `-90` for nominal and ordinal fields; `0` otherwise.
   *
   * @minimum -360
   * @maximum 360
   */
  labelAngle?: number;

  /**
   * The color of the tick label, can be in hex color code or regular color name.
   */
  labelColor?: string;

  /**
   * The font of the tick label.
   */
  labelFont?: string;

  /**
   * The font size of the label, in pixels.
   *
   * @minimum 0
   */
  labelFontSize?: number;

  /**
   * Maximum allowed pixel width of axis tick labels.
   */
  labelLimit?: number;

  /**
   * Boolean flag indicating if pixel position values should be rounded to the nearest integer.
   */
  tickRound?: boolean;

  /**
   * The width, in pixels, of ticks.
   *
   * @minimum 0
   */
  tickWidth?: number;

  // ---------- Title ----------
  /**
   * Horizontal text alignment of axis titles.
   */
  titleAlign?: string;

  /**
   * Angle in degrees of axis titles.
   */
  titleAngle?: number;
  /**
   * Vertical text baseline for axis titles.
   */
  titleBaseline?: string;
  /**
   * Color of the title, can be in hex color code or regular color name.
   */
  titleColor?: string;

  /**
   * Font of the title. (e.g., `"Helvetica Neue"`).
   */
  titleFont?: string;

  /**
   * Font size of the title.
   *
   * @minimum 0
   */
  titleFontSize?: number;

  /**
   * Font weight of the title.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  titleFontWeight?: FontWeight;

  /**
   * Maximum allowed pixel width of axis titles.
   */
  titleLimit?: number;

  /**
   * X-coordinate of the axis title relative to the axis group.
   */
  titleX?: number;

  /**
   * Y-coordinate of the axis title relative to the axis group.
   */
  titleY?: number;
}
