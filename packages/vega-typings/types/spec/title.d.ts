import {
  Encode,
  NumericValueRef,
  TextEncodeEntry,
  Baseline,
  FontWeight,
  TextBaseline,
} from './encode';
import { SignalRef } from './signal';
export type TitleOrient = 'none' | 'left' | 'right' | 'top' | 'bottom';
export type TitleAnchor = 'start' | 'middle' | 'end';
export type Title =
  | string
  | (Encode<TextEncodeEntry> & {
      text: string | SignalRef;
      name?: string;
      orient?: TitleOrient;
      anchor?: TitleAnchor;
      zindex?: number;
      interactive?: boolean;
      offset?: number | NumericValueRef;
    });

export interface VgTitle {
  /**
   * The title text.
   */
  text: string;

  /**
   * The orientation of the title relative to the chart. One of `"top"` (the default), `"bottom"`, `"left"`, or `"right"`.
   */
  orient?: TitleOrient;

  /**
   * The anchor position for placing the title. One of `"start"`, `"middle"` (the default), or `"end"`. For example, with an orientation of top these anchor positions map to a left-, center-, or right-aligned title.
   */
  anchor?: TitleAnchor;

  /**
   * The orthogonal offset in pixels by which to displace the title from its position along the edge of the chart.
   */
  offset?: number;

  style?: string | string[];

  // TODO: name, encode, interactive, zindex
}

export interface VgTitleConfig {
  /**
   * The anchor position for placing the title. One of `"start"`, `"middle"`, or `"end"`. For example, with an orientation of top these anchor positions map to a left-, center-, or right-aligned title.
   *
   * __Default value:__ `"middle"` for [single](spec.html) and [layered](layer.html) views.
   * `"start"` for other composite views.
   *
   * __Note:__ [For now](https://github.com/vega/vega-lite/issues/2875), `anchor` is only customizable only for [single](spec.html) and [layered](layer.html) views.  For other composite views, `anchor` is always `"start"`.
   */
  anchor?: TitleAnchor;
  /**
   * Angle in degrees of title text.
   */
  angle?: number;
  /**
   * Vertical text baseline for title text.
   */
  baseline?: TextBaseline;
  /**
   * Text color for title text.
   */
  color?: string;
  /**
   * Font name for title text.
   */
  font?: string;
  /**
   * Font size in pixels for title text.
   *
   * __Default value:__ `10`.
   *
   * @minimum 0
   */
  fontSize?: number;
  /**
   * Font weight for title text.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  fontWeight?: FontWeight;
  /**
   * The maximum allowed length in pixels of legend labels.
   *
   * @minimum 0
   */
  limit?: number;
  /**
   * Offset in pixels of the title from the chart body and axes.
   */
  offset?: number;
  /**
   * Default title orientation ("top", "bottom", "left", or "right")
   */
  orient?: TitleOrient;
}
