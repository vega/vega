import { GroupEncodeEntry, GuideEncodeEntry, SignalRef, TextEncodeEntry } from '.';
import { Encode, Text } from './encode';
import {
  AlignValue,
  AnchorValue,
  ColorValue,
  FontStyleValue,
  FontWeightValue,
  NumberValue,
  StringValue,
  TextBaselineValue,
} from './values';

export type TitleOrient = 'none' | 'left' | 'right' | 'top' | 'bottom';
export type TitleAnchor = null | 'start' | 'middle' | 'end';
export type TitleFrame = 'bounds' | 'group';

export interface Title extends BaseTitle {
  /**
   * The title text.
   */
  text: Text | SignalRef;

  /**
   * The subtitle text.
   */
  subtitle?: Text | SignalRef;

  /**
   * A mark name property to apply to the title text mark. (**Deprecated.**)
   */
  name?: string;

  /**
   * A boolean flag indicating if the title element should respond to input events such as mouse hover. (**Deprecated.**)
   */
  interactive?: boolean;

  /**
   * A mark style property to apply to the title text mark. If not specified, a default style of `"group-title"` is applied. (**Deprecated**)
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

  /**
   * Mark definitions for custom title encoding.
   */
  encode?: TitleEncode | Encode<TextEncodeEntry>; // second entry is **deprecated**
}

export interface TitleEncode {
  /**
   * Custom encoding for the title container group.
   */
  group?: GuideEncodeEntry<GroupEncodeEntry>;
  /**
   * Custom encoding for the title text.
   */
  title?: GuideEncodeEntry<TextEncodeEntry>;
  /**
   * Custom encoding for the subtitle text.
   */
  subtitle?: GuideEncodeEntry<TextEncodeEntry>;
}

export interface BaseTitle<
  N = NumberValue,
  S = StringValue,
  C = ColorValue,
  FW = FontWeightValue,
  FS = FontStyleValue,
  A = AlignValue,
  TB = TextBaselineValue,
  F = TitleFrame | StringValue,
  AN = AnchorValue,
  O = TitleOrient | SignalRef
> {
  /**
   * The anchor position for placing the title and subtitle text. One of `"start"`, `"middle"`, or `"end"`. For example, with an orientation of top these anchor positions map to a left-, center-, or right-aligned title.
   */
  anchor?: AN;

  /**
   * The reference frame for the anchor position, one of `"bounds"` (to anchor relative to the full bounding box) or `"group"` (to anchor relative to the group width or height).
   */
  frame?: F;

  /**
   * The orthogonal offset in pixels by which to displace the title group from its position along the edge of the chart.
   */
  offset?: N;

  /**
   * Horizontal text alignment for title text. One of `"left"`, `"center"`, or `"right"`.
   */
  align?: A;

  /**
   * Angle in degrees of title and subtitle text.
   */
  angle?: N;

  /**
   * Vertical text baseline for title and subtitle text. One of `"top"`, `"middle"`, `"bottom"`, or `"alphabetic"`.
   */
  baseline?: TB;

  /**
   * Delta offset for title and subtitle text x-coordinate.
   */
  dx?: N;

  /**
   * Delta offset for title and subtitle text y-coordinate.
   */
  dy?: N;

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
   * @minimum 0
   */
  fontSize?: N;

  /**
   * Font style for title text.
   */
  fontStyle?: FS;

  /**
   * Font weight for title text.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  fontWeight?: FW;

  /**
   * Line height in pixels for multi-line title text.
   */
  lineHeight?: N;

  /**
   * The maximum allowed length in pixels of title and subtitle text.
   *
   * @minimum 0
   */
  limit?: N;

  /**
   * Default title orientation (`"top"`, `"bottom"`, `"left"`, or `"right"`)
   */
  orient?: O;

  /**
   * Text color for subtitle text.
   */
  subtitleColor?: C;

  /**
   * Font name for subtitle text.
   */
  subtitleFont?: S;

  /**
   * Font size in pixels for subtitle text.
   *
   * @minimum 0
   */
  subtitleFontSize?: N;

  /**
   * Font style for subtitle text.
   */
  subtitleFontStyle?: FS;

  /**
   * Font weight for subtitle text.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  subtitleFontWeight?: FW;

  /**
   * Line height in pixels for multi-line subtitle text.
   */
  subtitleLineHeight?: N;

  /**
   * The padding in pixels between title and subtitle text.
   */
  subtitlePadding?: N;
}
