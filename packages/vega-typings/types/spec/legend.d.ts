import {
  GroupEncodeEntry,
  Orientation,
  RectEncodeEntry,
  SignalRef,
  SymbolEncodeEntry,
  TextEncodeEntry,
} from '.';
import { FormatType, LabelOverlap, TickCount } from './axis';
import { LayoutAlign } from './layout';
import {
  AlignValue,
  AnchorValue,
  ColorValue,
  DashArrayValue,
  FontStyleValue,
  FontWeightValue,
  NumberValue,
  OrientValue,
  StringValue,
  SymbolShapeValue,
  TextBaselineValue,
} from './values';

export interface GuideEncodeEntry<T> {
  name?: string;
  /**
   * A boolean flag indicating if the guide element should respond to input events such as mouse hover.
   */
  interactive?: boolean;

  /**
   * A mark style property to apply to the guide group mark.
   */
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

export interface Legend extends BaseLegend {
  size?: string;
  shape?: string;
  fill?: string;
  stroke?: string;
  strokeDash?: string;
  strokeWidth?: string;
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
  direction?: Orientation;

  /**
   * The format specifier pattern for legend labels. For numerical values, must be a legal [d3-format](https://github.com/d3/d3-format#locale_format) specifier. For date-time values, must be a legal [d3-time-format](https://github.com/d3/d3-time-format#locale_format) specifier.
   */
  format?: string | SignalRef;

  /**
   * The format type for legend labels (number or time).
   */
  formatType?: FormatType | SignalRef;

  /**
   * The title for the legend.
   */
  title?: string | SignalRef;

  /**
   * The desired number of tick values for quantitative legends.
   */
  tickCount?: TickCount;

  /**
   * The minimum desired step between tick values for quantitative legends, in terms of scale domain values. For example, a value of `1` indicates that ticks should not be less than 1 unit apart. If `tickMinStep` is specified, the `tickCount` value will be adjusted, if necessary, to enforce the minimum step value.
   */
  tickMinStep?: number | SignalRef;

  /**
   * Explicitly set the visible legend values.
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
   * Mark definitions for custom legend encoding.
   */
  encode?: LegendEncode;
}

export interface LegendEncode {
  title?: GuideEncodeEntry<GroupEncodeEntry>;
  labels?: GuideEncodeEntry<TextEncodeEntry>;
  legend?: GuideEncodeEntry<GroupEncodeEntry>;
  entries?: GuideEncodeEntry<TextEncodeEntry>;
  symbols?: GuideEncodeEntry<SymbolEncodeEntry>;
  gradient?: GuideEncodeEntry<RectEncodeEntry>;
}

/**
 * Properties shared between legends and legend configs.
 */
export interface BaseLegend<
  N = NumberValue,
  NS = number | SignalRef,
  S = StringValue,
  C = ColorValue,
  FW = FontWeightValue,
  FS = FontStyleValue,
  A = AlignValue,
  TB = TextBaselineValue,
  LA = LayoutAlign | SignalRef,
  LO = LabelOverlap | SignalRef,
  SY = SymbolShapeValue,
  DA = DashArrayValue,
  O = OrientValue,
  AN = AnchorValue,
  LOR = LegendOrient | SignalRef
> {
  /**
   * The orientation of the legend, which determines how the legend is positioned within the scene. One of "left", "right", "top-left", "top-right", "bottom-left", "bottom-right", "none".
   *
   * __Default value:__ `"right"`
   */
  orient?: LOR;

  // ---------- Legend Group ----------
  /**
   * Corner radius for the full legend.
   */
  cornerRadius?: N;

  /**
   * Background fill color for the full legend.
   */
  fillColor?: C;

  /**
   * The offset in pixels by which to displace the legend from the data rectangle and axes.
   *
   * __Default value:__ `18`.
   */
  offset?: N;

  /**
   * The padding between the border and content of the legend group.
   *
   * __Default value:__ `0`.
   */
  padding?: N;

  /**
   * Border stroke color for the full legend.
   */
  strokeColor?: C;

  // ---------- Title ----------
  /**
   * Horizontal text alignment for legend titles.
   *
   * __Default value:__ `"left"`.
   */
  titleAlign?: A;

  /**
   * Text anchor position for placing legend titles.
   */
  titleAnchor?: AN;

  /**
   * Vertical text baseline for legend titles.
   *
   * __Default value:__ `"top"`.
   */
  titleBaseline?: TB;

  /**
   * The color of the legend title, can be in hex color code or regular color name.
   */
  titleColor?: C;

  /**
   * The font of the legend title.
   */
  titleFont?: S;

  /**
   * The font size of the legend title.
   */
  titleFontSize?: N;

  /**
   * The font style of the legend title.
   */
  titleFontStyle?: FS;

  /**
   * The font weight of the legend title.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  titleFontWeight?: FW;

  /**
   * Maximum allowed pixel width of axis titles.
   *
   * __Default value:__ `180`.
   * @minimum 0
   */
  titleLimit?: N;

  /**
   * Opacity of the legend title.
   */
  titleOpacity?: N;

  /**
   * Orientation of the legend title.
   */
  titleOrient?: O;

  /**
   * The padding, in pixels, between title and legend.
   *
   * __Default value:__ `5`.
   */
  titlePadding?: N;

  // ---------- Gradient ----------

  /**
   * The length in pixels of the primary axis of a color gradient. This value corresponds to the height of a vertical gradient or the width of a horizontal gradient.
   *
   * __Default value:__ `200`.
   * @minimum 0
   */
  gradientLength?: NS;

  /**
   * Opacity of the color gradient.
   */
  gradientOpacity?: N;

  /**
   * The thickness in pixels of the color gradient. This value corresponds to the width of a vertical gradient or the height of a horizontal gradient.
   *
   * __Default value:__ `16`.
   * @minimum 0
   */
  gradientThickness?: NS;

  /**
   * The color of the gradient stroke, can be in hex color code or regular color name.
   *
   * __Default value:__ `"lightGray"`.
   */
  gradientStrokeColor?: C;

  /**
   * The width of the gradient stroke, in pixels.
   *
   * __Default value:__ `0`.
   * @minimum 0
   */
  gradientStrokeWidth?: N;

  // ---------- Symbol Layout ----------
  /**
   * The height in pixels to clip symbol legend entries and limit their size.
   */
  clipHeight?: NS;

  /**
   * The number of columns in which to arrange symbol legend entries. A value of `0` or lower indicates a single row with one column per entry.
   */
  columns?: NS;

  /**
   * The horizontal padding in pixels between symbol legend entries.
   *
   * __Default value:__ `10`.
   */
  columnPadding?: NS;

  /**
   * The vertical padding in pixels between symbol legend entries.
   *
   * __Default value:__ `2`.
   */
  rowPadding?: NS;

  /**
   * The alignment to apply to symbol legends rows and columns. The supported string values are `"all"`, `"each"` (the default), and `none`. For more information, see the [grid layout documentation](https://vega.github.io/vega/docs/layout).
   *
   * __Default value:__ `"each"`.
   */
  gridAlign?: LA;

  // ---------- Symbols ----------
  /**
   * An array of alternating [stroke, space] lengths for dashed symbol strokes.
   */
  symbolDash?: DA;

  /**
   * The pixel offset at which to start drawing with the symbol stroke dash array.
   */
  symbolDashOffset?: N;

  /**
   * The color of the legend symbol,
   */
  symbolFillColor?: C;

  /**
   * Horizontal pixel offset for legend symbols.
   *
   * __Default value:__ `0`.
   */
  symbolOffset?: N;

  /**
   * Opacity of the legend symbols.
   */
  symbolOpacity?: N;

  /**
   * The size of the legend symbol, in pixels.
   *
   * __Default value:__ `100`.
   * @minimum 0
   */
  symbolSize?: N;

  /**
   * Stroke color for legend symbols.
   */
  symbolStrokeColor?: C;

  /**
   * The width of the symbol's stroke.
   *
   * __Default value:__ `1.5`.
   * @minimum 0
   */
  symbolStrokeWidth?: N;

  /**
   * Default shape type (such as "circle") for legend symbols.
   * Can be one of ``"circle"`, `"square"`, `"cross"`, `"diamond"`, `"triangle-up"`, `"triangle-down"`, `"triangle-right"`, or `"triangle-left"`.
   * In addition to a set of built-in shapes, custom shapes can be defined using [SVG path strings](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths).
   *
   * __Default value:__ `"circle"`.
   */
  symbolType?: SY;

  // ---------- Label ----------
  /**
   * The alignment of the legend label, can be left, center, or right.
   */
  labelAlign?: A;

  /**
   * The position of the baseline of legend label, can be `"top"`, `"middle"`, `"bottom"`, or `"alphabetic"`.
   *
   * __Default value:__ `"middle"`.
   */
  labelBaseline?: TB;

  /**
   * The color of the legend label, can be in hex color code or regular color name.
   */
  labelColor?: C;

  /**
   * The font of the legend label.
   */
  labelFont?: S;

  /**
   * The font size of legend label.
   *
   * __Default value:__ `10`.
   *
   * @minimum 0
   */
  labelFontSize?: N;

  /**
   * The font style of legend label.
   */
  labelFontStyle?: FS;

  /**
   * The font weight of legend label.
   */
  labelFontWeight?: FW;

  /**
   * Maximum allowed pixel width of axis tick labels.
   *
   * __Default value:__ `160`.
   */
  labelLimit?: N;

  /**
   * Opacity of labels.
   */
  labelOpacity?: N;

  /**
   * Padding in pixels between the legend and legend labels.
   */
  labelPadding?: N;

  /**
   * The offset of the legend label.
   * @minimum 0
   *
   * __Default value:__ `4`.
   */
  labelOffset?: N;

  /**
   * The strategy to use for resolving overlap of labels in gradient legends. If `false`, no overlap reduction is attempted. If set to `true` (default) or `"parity"`, a strategy of removing every other label is used. If set to `"greedy"`, a linear scan of the labels is performed, removing any label that overlaps with the last visible label (this often works better for log-scaled axes).
   *
   * __Default value:__ `true`.
   */
  labelOverlap?: LO;

  /**
   * The minimum separation that must be between label bounding boxes for them to be considered non-overlapping (default `0`). This property is ignored if *labelOverlap* resolution is not enabled.
   */
  labelSeparation?: NS;
}
