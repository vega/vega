import { Encodable, NumericValueRef, SignalRef, TextEncodeEntry } from '.';
import { TextBaseline } from './encode';
import {
  NumberValue,
  StringValue,
  AnchorValue,
  FontWeightValue,
  ColorValue,
  TextBaselineValue,
  AlignValue,
} from './values';

export type TitleOrient = 'none' | 'left' | 'right' | 'top' | 'bottom';
export type TitleAnchor = 'start' | 'middle' | 'end';
export type TitleFrame = 'bounds' | 'group';

export interface Title extends Encodable<TextEncodeEntry>, BaseTitle {
  /**
   * The title text.
   */
  text: string | SignalRef;

  /**
   * A mark name property to apply to the title text mark.
   */
  name?: string;

  /**
   * A boolean flag indicating if the title element should respond to input events such as mouse hover.
   */
  interactive?: boolean;

  /**
   * A mark style property to apply to the title text mark. If not specified, a default style of `"group-title"` is applied.
   */
  style?: string | string[];

  /**
   * 	The integer z-index indicating the layering of the title group relative to other axis, mark and legend groups.
   *
   * __Default value:__ `0`.
   *
   * @TJS-type integer
   * @minimum 0
   */
  zindex?: number;
}

export interface BaseTitle<
  N = NumberValue,
  S = StringValue,
  C = ColorValue,
  FW = FontWeightValue,
  A = AlignValue,
  TB = TextBaselineValue,
  F = TitleFrame | StringValue,
  AN = AnchorValue
> {
  /**
   * The anchor position for placing the title. One of `"start"`, `"middle"`, or `"end"`. For example, with an orientation of top these anchor positions map to a left-, center-, or right-aligned title.
   */
  anchor?: AN;

  /**
   * The reference frame for the anchor position, one of `"bounds"` (to anchor relative to the full bounding box) or `"group"` (to anchor relative to the group width or height).
   */
  frame?: F;

  /**
   * The orthogonal offset in pixels by which to displace the title from its position along the edge of the chart.
   */
  offset?: N;

  align?: A;

  /**
   * Angle in degrees of title text.
   */
  angle?: N;

  /**
   * Vertical text baseline for title text. One of `"top"`, `"middle"`, `"bottom"`, or `"alphabetic"`.
   */
  baseline?: TB;

  /**
   * Text color for title text.
   */
  color?: C;

  /**
   * Font name for title text.
   */
  font?: S;

  /**
   * Font size in pixels for title text.
   *
   * __Default value:__ `10`.
   *
   * @minimum 0
   */
  fontSize?: N;

  /**
   * Font weight for title text.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  fontWeight?: FW;

  /**
   * The maximum allowed length in pixels of legend labels.
   *
   * @minimum 0
   */
  limit?: N;

  /**
   * Default title orientation (`"top"`, `"bottom"`, `"left"`, or `"right"`)
   */
  orient?: TitleOrient;
}
