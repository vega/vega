import {
  AutoSize,
  EventType,
  Orientation,
  Interpolate,
  Align,
  TextBaseline,
  FontStyle,
  FontWeight,
  TitleAnchor,
  TitleOrient,
  Axis,
  Legend,
  BaseLegend,
  RangeScheme,
  SymbolShape,
  Mark,
  LegendOrient,
} from '.';

export interface Config
  extends Partial<Record<MarkConfigKeys, MarkConfig>>,
    Partial<Record<AxisConfigKeys, AxisConfig>> {
  autosize?: AutoSize;
  background?: string;
  group?: any; // TODO
  events?: {
    defaults?: DefaultsConfig;
  };
  style?: any; // TODO
  legend?: LegendConfig;
  title?: TitleConfig;
  range?: {
    category?: RangeScheme | string[];
    diverging?: RangeScheme | string[];
    heatmap?: RangeScheme | string[];
    ordinal?: RangeScheme | string[];
    ramp?: RangeScheme | string[];
    symbol?: SymbolShape[];
  };
}

export type DefaultsConfig = Record<'prevent' | 'allow', boolean | EventType[]>;

export type MarkConfigKeys = 'mark' | Mark['type'];

export interface MarkConfig {
  /**
   * Default Fill Color.  This has higher precedence than config.color
   *
   * __Default value:__ (None)
   *
   */
  fill?: string;

  /**
   * Default Stroke Color.  This has higher precedence than config.color
   *
   * __Default value:__ (None)
   *
   */
  stroke?: string;

  // ---------- Opacity ----------
  /**
   * The overall opacity (value between [0,1]).
   *
   * __Default value:__ `0.7` for non-aggregate plots with `point`, `tick`, `circle`, or `square` marks or layered `bar` charts and `1` otherwise.
   *
   * @minimum 0
   * @maximum 1
   */
  opacity?: number;

  /**
   * The fill opacity (value between [0,1]).
   *
   * __Default value:__ `1`
   *
   * @minimum 0
   * @maximum 1
   */
  fillOpacity?: number;

  /**
   * The stroke opacity (value between [0,1]).
   *
   * __Default value:__ `1`
   *
   * @minimum 0
   * @maximum 1
   */
  strokeOpacity?: number;

  // ---------- Stroke Style ----------
  /**
   * The stroke width, in pixels.
   *
   * @minimum 0
   */
  strokeWidth?: number;

  /**
   * An array of alternating stroke, space lengths for creating dashed or dotted lines.
   */
  strokeDash?: number[];

  /**
   * The offset (in pixels) into which to begin drawing with the stroke dash array.
   */
  strokeDashOffset?: number;

  // ---------- Orientation: Bar, Tick, Line, Area ----------
  /**
   * The orientation of a non-stacked bar, tick, area, and line charts.
   * The value is either horizontal (default) or vertical.
   * - For bar, rule and tick, this determines whether the size of the bar and tick
   * should be applied to x or y dimension.
   * - For area, this property determines the orient property of the Vega output.
   * - For line, this property determines the sort order of the points in the line
   * if `config.sortLineBy` is not specified.
   * For stacked charts, this is always determined by the orientation of the stack;
   * therefore explicitly specified value will be ignored.
   */
  orient?: Orientation;

  // ---------- Interpolation: Line / area ----------
  /**
   * The line interpolation method to use for line and area marks. One of the following:
   * - `"linear"`: piecewise linear segments, as in a polyline.
   * - `"linear-closed"`: close the linear segments to form a polygon.
   * - `"step"`: alternate between horizontal and vertical segments, as in a step function.
   * - `"step-before"`: alternate between vertical and horizontal segments, as in a step function.
   * - `"step-after"`: alternate between horizontal and vertical segments, as in a step function.
   * - `"basis"`: a B-spline, with control point duplication on the ends.
   * - `"basis-open"`: an open B-spline; may not intersect the start or end.
   * - `"basis-closed"`: a closed B-spline, as in a loop.
   * - `"cardinal"`: a Cardinal spline, with control point duplication on the ends.
   * - `"cardinal-open"`: an open Cardinal spline; may not intersect the start or end, but will intersect other control points.
   * - `"cardinal-closed"`: a closed Cardinal spline, as in a loop.
   * - `"bundle"`: equivalent to basis, except the tension parameter is used to straighten the spline.
   * - `"monotone"`: cubic interpolation that preserves monotonicity in y.
   */
  interpolate?: Interpolate;
  /**
   * Depending on the interpolation type, sets the tension parameter (for line and area marks).
   * @minimum 0
   * @maximum 1
   */
  tension?: number;

  /**
   * The default symbol shape to use. One of: `"circle"` (default), `"square"`, `"cross"`, `"diamond"`, `"triangle-up"`, or `"triangle-down"`, or a custom SVG path.
   *
   * __Default value:__ `"circle"`
   *
   */
  shape?: SymbolShape;

  /**
   * The pixel area each the point/circle/square.
   * For example: in the case of circles, the radius is determined in part by the square root of the size value.
   *
   * __Default value:__ `30`
   *
   * @minimum 0
   */
  size?: number;

  // Text / Label Mark Config
  /**
   * The horizontal alignment of the text. One of `"left"`, `"right"`, `"center"`.
   */
  align?: Align;

  /**
   * The rotation angle of the text, in degrees.
   * @minimum 0
   * @maximum 360
   */
  angle?: number;

  /**
   * The vertical alignment of the text. One of `"top"`, `"bottom"`, `"middle"`.
   *
   * __Default value:__ `"middle"`
   *
   */
  baseline?: TextBaseline;

  /**
   * The horizontal offset, in pixels, between the text label and its anchor point. The offset is applied after rotation by the _angle_ property.
   */
  dx?: number;

  /**
   * The vertical offset, in pixels, between the text label and its anchor point. The offset is applied after rotation by the _angle_ property.
   */
  dy?: number;

  /**
   * Polar coordinate radial offset, in pixels, of the text label from the origin determined by the `x` and `y` properties.
   * @minimum 0
   */
  radius?: number;

  /**
   * The maximum length of the text mark in pixels (default 0, indicating no limit). The text value will be automatically truncated if the rendered size exceeds the limit.
   */
  limit?: number;

  /**
   * Polar coordinate angle, in radians, of the text label from the origin determined by the `x` and `y` properties. Values for `theta` follow the same convention of `arc` mark `startAngle` and `endAngle` properties: angles are measured in radians, with `0` indicating "north".
   */
  theta?: number;

  /**
   * The typeface to set the text in (e.g., `"Helvetica Neue"`).
   */
  font?: string;

  /**
   * The font size, in pixels.
   * @minimum 0
   */
  fontSize?: number;

  /**
   * The font style (e.g., `"italic"`).
   */
  fontStyle?: FontStyle;
  /**
   * The font weight.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  fontWeight?: FontWeight;

  /**
   * Placeholder text if the `text` channel is not specified
   */
  text?: string;

  /**
   * A URL to load upon mouse click. If defined, the mark acts as a hyperlink.
   *
   * @format uri
   */
  href?: string;

  /**
   * The mouse cursor used over the mark. Any valid [CSS cursor type](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Values) can be used.
   */
  cursor?:
    | 'auto'
    | 'default'
    | 'none'
    | 'context-menu'
    | 'help'
    | 'pointer'
    | 'progress'
    | 'wait'
    | 'cell'
    | 'crosshair'
    | 'text'
    | 'vertical-text'
    | 'alias'
    | 'copy'
    | 'move'
    | 'no-drop'
    | 'not-allowed'
    | 'e-resize'
    | 'n-resize'
    | 'ne-resize'
    | 'nw-resize'
    | 's-resize'
    | 'se-resize'
    | 'sw-resize'
    | 'w-resize'
    | 'ew-resize'
    | 'ns-resize'
    | 'nesw-resize'
    | 'nwse-resize'
    | 'col-resize'
    | 'row-resize'
    | 'all-scroll'
    | 'zoom-in'
    | 'zoom-out'
    | 'grab'
    | 'grabbing';
}

export type AxisConfigKeys =
  | 'axis'
  | 'axisX'
  | 'axisY'
  | 'axisTop'
  | 'axisRight'
  | 'axisBottom'
  | 'axisLeft'
  | 'axisBand';

export interface AxisConfig extends Partial<Axis> {
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
   * Boolean flag indicating if an extra axis tick should be added for the initial position of the axis. This flag is useful for styling axes for `band` scales such that ticks are placed on band boundaries rather in the middle of a band. Use in conjunction with `"bandPostion": 1` and an axis `"padding"` value of `0`.
   */
  tickExtra?: boolean;

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

export interface LegendConfig extends BaseLegend {
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
  symbolType?: SymbolShape;

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

export interface TitleConfig {
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
