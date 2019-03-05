import {
  Align,
  AutoSize,
  EventType,
  FontStyle,
  FontWeight,
  Interpolate,
  Mark,
  Orientation,
  RangeScheme,
  SymbolShape,
  TextBaseline,
} from '.';
import { BaseAxis, LabelOverlap } from './axis';
import { LayoutAlign, LayoutBounds } from './layout';
import { BaseLegend, LegendOrient } from './legend';
import { SignalRef } from './signal';
import { BaseTitle, TitleAnchor } from './title';
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

  /**
   * The stroke cap for line ending style.
   *
   * __Default value:__ `butt`
   *
   */
  strokeCap?: string;

  /**
   * The stroke line join method.
   *
   * __Default value:__ `miter`
   *
   */
  strokeJoin?: string;

  /**
   * The miter limit at which to bevel a line join.
   */
  strokeMiterLimit?: number;

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
   * The vertical alignment of the text. One of `"top"`, `"bottom"`, `"middle"`, `"alphabetic"`.
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

export type AxisConfig = BaseAxis;

/**
 * Legend Config without signals so we can use it in Vega-Lite.
 */
export interface LegendConfig<
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
> extends BaseLegend<N, NS, S, C, FW, FS, A, TB, LA, LO, SY, DA, O, AN, LOR> {
  /**
   * The default direction (`"horizontal"` or `"vertical"`) for gradient legends.
   *
   * __Default value:__ `"vertical"`.
   */
  gradientDirection?: Orientation;

  /**
   * The maximum allowed length in pixels of color ramp gradient labels.
   */
  gradientLabelLimit?: N;

  /**
   * Vertical offset in pixels for color ramp gradient labels.
   *
   * __Default value:__ `2`.
   */
  gradientLabelOffset?: N;

  /**
   * Default fill color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend.
   *
   * __Default value:__ `"transparent"`.
   */
  symbolBaseFillColor?: C;

  /**
   * Default stroke color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend.
   *
   * __Default value:__ `"gray"`.
   */
  symbolBaseStrokeColor?: C;

  /**
   * The default direction (`"horizontal"` or `"vertical"`) for symbol legends.
   *
   * __Default value:__ `"vertical"`.
   */
  symbolDirection?: Orientation;

  /**
   * Border stroke dash pattern for the full legend.
   */
  strokeDash?: number[];

  /**
   * Border stroke width for the full legend.
   */
  strokeWidth?: N;

  /**
   * Legend orient group layout parameters.
   */
  layout?: LegendLayout;
}

export interface BaseLegendLayout<
  NS = number | SignalRef,
  BS = boolean | SignalRef,
  OS = Orientation | SignalRef,
  LB = LayoutBounds,
  AN = TitleAnchor
> {
  /**
   * The anchor point for legend orient group layout.
   */
  anchor?: AN;

  /**
   * The bounds calculation to use for legend orient group layout.
   */
  bounds?: LB;

  /**
   * A flag to center legends within a shared orient group.
   */
  center?: BS;

  /**
   * The layout direction for legend orient group layout.
   */
  direction?: OS;

  /**
   * The pixel margin between legends within a orient group.
   */
  margin?: NS;

  /**
   * The pixel offset from the chart body for a legend orient group.
   */
  offset?: NS;
}

export interface LegendLayout extends BaseLegendLayout {
  left?: BaseLegendLayout;
  right?: BaseLegendLayout;
  top?: BaseLegendLayout;
  bottom?: BaseLegendLayout;
  'top-left'?: BaseLegendLayout;
  'top-right'?: BaseLegendLayout;
  'bottom-left'?: BaseLegendLayout;
  'bottom-right'?: BaseLegendLayout;
}

export type TitleConfig = BaseTitle;
