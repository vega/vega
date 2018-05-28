import {
  GroupEncodeEntry,
  GuideEncodeEntry,
  TimeInterval,
  NumericValueRef,
  RuleEncodeEntry,
  SignalRef,
  TextEncodeEntry,
} from '.';

export type AxisOrient = 'top' | 'bottom' | 'left' | 'right';

export interface Axis {
  orient: AxisOrient;
  scale: string;
  name?: string;
  title?: string | SignalRef;
  zindex?: number;
  interactive?: boolean;
  /**
   * Boolean value that determines whether the axis should include ticks.
   */
  ticks?: boolean;
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
  labelFlushOffset?: number;
  /**
   * The padding, in pixels, between axis and text labels.
   */
  labelPadding?: number;
  /**
   * The strategy to use for resolving overlap of axis labels. If `false` (the default), no overlap reduction is attempted. If set to `true` or `"parity"`, a strategy of removing every other label is used (this works well for standard linear axes). If set to `"greedy"`, a linear scan of the labels is performed, removing any labels that overlaps with the last visible label (this often works better for log-scaled axes).
   *
   * __Default value:__ `true` for non-nominal fields with non-log scales; `"greedy"` for log scales; otherwise `false`.
   */
  labelOverlap?: boolean | 'parity' | 'greedy';
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
  gridScale?: string;
  /**
   * The size in pixels of axis ticks.
   *
   * @minimum 0
   */
  tickSize?: number;
  tickCount?: number | TimeInterval | SignalRef;
  format?: string | SignalRef;
  values?: any[] | SignalRef;
  offset?: number | NumericValueRef;
  position?: number | NumericValueRef;
  /**
   * The padding, in pixels, between title and axis.
   */
  titlePadding?: number | NumericValueRef;
  /**
   * The minimum extent in pixels that axis ticks and labels should use. This determines a minimum offset value for axis titles.
   *
   * __Default value:__ `30` for y-axis; `undefined` for x-axis.
   */
  minExtent?: number | NumericValueRef;
  /**
   * The maximum extent in pixels that axis ticks and labels should use. This determines a maximum offset value for axis titles.
   *
   * __Default value:__ `undefined`.
   */
  maxExtent?: number | NumericValueRef;
  encode?: {
    ticks?: GuideEncodeEntry<GroupEncodeEntry>;
    labels?: GuideEncodeEntry<TextEncodeEntry>;
    title?: GuideEncodeEntry<TextEncodeEntry>;
    grid?: GuideEncodeEntry<RuleEncodeEntry>;
    domain?: GuideEncodeEntry<RuleEncodeEntry>;
  };
}
