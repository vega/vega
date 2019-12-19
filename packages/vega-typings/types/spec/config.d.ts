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
import { BaseAxis } from './axis';
import { Color } from './color';
import { ColorValueRef, NumericValueRef, ScaledValueRef } from './encode.d';
import { LayoutBounds } from './layout';
import { BaseLegend } from './legend';
import { BaseProjection } from './projection';
import { InitSignal, NewSignal, SignalRef } from './signal';
import { BaseTitle, TitleAnchor } from './title';

export type ExcludeValueRefKeepSignal<T> =
  | Exclude<T, ScaledValueRef<any> | NumericValueRef | ColorValueRef>
  | KeepSignal<T>;

export type KeepSignal<T> = T extends SignalRef ? SignalRef : never;

/**
 * Config properties cannot be scaled or reference fields but they can reference signals.
 */
export type ExcludeMappedValueRef<T> = {
  [P in keyof T]: ExcludeValueRefKeepSignal<T[P]>;
};

export interface Config
  extends Partial<Record<MarkConfigKeys, MarkConfig>>,
    Partial<Record<AxisConfigKeys, AxisConfig>> {
  autosize?: AutoSize;
  background?: null | Color | SignalRef;
  group?: any; // TODO
  events?: {
    bind?: 'any' | 'container' | 'none';
    defaults?: DefaultsConfig;
    selector?: boolean | string[];
    timer?: boolean;
    view?: boolean | string[];
    window?: boolean | string[];
  };
  style?: {
    [style: string]: MarkConfig;
  };
  legend?: LegendConfig;
  title?: TitleConfig;
  projection?: ProjectionConfig;
  range?: RangeConfig;
  signals?: (InitSignal | NewSignal)[];
}

export type DefaultsConfig = Record<'prevent' | 'allow', boolean | EventType[]>;

export type MarkConfigKeys = 'mark' | Mark['type'];

export interface MarkConfig {
  /**
   * Default fill color.
   *
   * __Default value:__ (None)
   *
   */
  fill?: Color | null | SignalRef;

  /**
   * Default stroke color.
   *
   * __Default value:__ (None)
   *
   */
  stroke?: Color | null | SignalRef;

  // ---------- Opacity ----------
  /**
   * The overall opacity (value between [0,1]).
   *
   * @minimum 0
   * @maximum 1
   */
  opacity?: number | SignalRef;

  /**
   * The fill opacity (value between [0,1]).
   *
   * __Default value:__ `1`
   *
   * @minimum 0
   * @maximum 1
   */
  fillOpacity?: number | SignalRef;

  /**
   * The stroke opacity (value between [0,1]).
   *
   * __Default value:__ `1`
   *
   * @minimum 0
   * @maximum 1
   */
  strokeOpacity?: number | SignalRef;

  // ---------- Stroke Style ----------
  /**
   * The stroke width, in pixels.
   *
   * @minimum 0
   */
  strokeWidth?: number | SignalRef;

  /**
   * An array of alternating stroke, space lengths for creating dashed or dotted lines.
   */
  strokeDash?: number[] | SignalRef;

  /**
   * The offset (in pixels) into which to begin drawing with the stroke dash array.
   */
  strokeDashOffset?: number | SignalRef;

  /**
   * The offset in pixels at which to draw the group stroke and fill. If unspecified, the default behavior is to dynamically offset stroked groups such that 1 pixel stroke widths align with the pixel grid.
   */
  strokeOffset?: number | SignalRef;

  /**
   * The stroke cap for line ending style.
   *
   * __Default value:__ `butt`
   *
   */
  strokeCap?: string | SignalRef;

  /**
   * The stroke line join method.
   *
   * __Default value:__ `miter`
   *
   */
  strokeJoin?: string | SignalRef;

  /**
   * The miter limit at which to bevel a line join.
   */
  strokeMiterLimit?: number | SignalRef;

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
  orient?: Orientation | SignalRef;

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
  interpolate?: Interpolate | SignalRef;

  /**
   * Depending on the interpolation type, sets the tension parameter (for line and area marks).
   */
  tension?: number | SignalRef;

  /**
   * The default symbol shape to use. One of: `"circle"` (default), `"square"`, `"cross"`, `"diamond"`, `"triangle-up"`, or `"triangle-down"`, or a custom SVG path.
   *
   * __Default value:__ `"circle"`
   *
   */
  shape?: SymbolShape | SignalRef;

  /**
   * The pixel area each the point/circle/square.
   * For example: in the case of circles, the radius is determined in part by the square root of the size value.
   *
   * __Default value:__ `30`
   *
   * @minimum 0
   */
  size?: number | SignalRef;

  // Text / Label Mark Config
  /**
   * The horizontal alignment of the text. One of `"left"`, `"right"`, `"center"`.
   */
  align?: Align | SignalRef;

  /**
   * The rotation angle of the text, in degrees.
   *
   * @minimum 0
   * @maximum 360
   */
  angle?: number | SignalRef;

  /**
   * The vertical alignment of the text. One of `"top"`, `"bottom"`, `"middle"`, `"alphabetic"`.
   *
   * __Default value:__ `"middle"`
   *
   */
  baseline?: TextBaseline | SignalRef;

  /**
   * The horizontal offset, in pixels, between the text label and its anchor point. The offset is applied after rotation by the _angle_ property.
   */
  dx?: number | SignalRef;

  /**
   * The vertical offset, in pixels, between the text label and its anchor point. The offset is applied after rotation by the _angle_ property.
   */
  dy?: number | SignalRef;

  /**
   * Polar coordinate radial offset, in pixels, of the text label from the origin determined by the `x` and `y` properties.
   *
   * @minimum 0
   */
  radius?: number | SignalRef;

  /**
   * The maximum length of the text mark in pixels (default 0, indicating no limit). The text value will be automatically truncated if the rendered size exceeds the limit.
   */
  limit?: number | SignalRef;

  /**
   * A delimiter, such as a newline character, upon which to break text strings into multiple lines. This property is ignored if the text is array-valued.
   */
  lineBreak?: string | SignalRef;

  /**
   * The line height in pixels (the spacing between subsequent lines of text) for multi-line text marks.
   */
  lineHeight?: number | SignalRef;

  /**
   * Polar coordinate angle, in radians, of the text label from the origin determined by the `x` and `y` properties. Values for `theta` follow the same convention of `arc` mark `startAngle` and `endAngle` properties: angles are measured in radians, with `0` indicating "north".
   */
  theta?: number | SignalRef;

  /**
   * The typeface to set the text in (e.g., `"Helvetica Neue"`).
   */
  font?: string | SignalRef;

  /**
   * The font size, in pixels.
   *
   * @minimum 0
   */
  fontSize?: number | SignalRef;

  /**
   * The font style (e.g., `"italic"`).
   */
  fontStyle?: FontStyle | SignalRef;
  /**
   * The font weight.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  fontWeight?: FontWeight | SignalRef;

  /**
   * Placeholder text if the `text` channel is not specified
   */
  text?: string | SignalRef;

  /**
   * A URL to load upon mouse click. If defined, the mark acts as a hyperlink.
   *
   * @format uri
   */
  href?: string | SignalRef;

  /**
   * The mouse cursor used over the mark. Any valid [CSS cursor type](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Values) can be used.
   */
  cursor?: Cursor | SignalRef;
}

export type Cursor =
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

export type AxisConfigKeys =
  | 'axis'
  | 'axisX'
  | 'axisY'
  | 'axisTop'
  | 'axisRight'
  | 'axisBottom'
  | 'axisLeft'
  | 'axisBand';

export type AxisConfig = ExcludeMappedValueRef<BaseAxis>;

/**
 * Legend config without signals so we can use it in Vega-Lite.
 */
export interface LegendConfig extends BaseLegend {
  /**
   * The default direction (`"horizontal"` or `"vertical"`) for gradient legends.
   *
   * __Default value:__ `"vertical"`.
   */
  gradientDirection?: Orientation;

  /**
   * The maximum allowed length in pixels of color ramp gradient labels.
   */
  gradientLabelLimit?: number | SignalRef;

  /**
   * Vertical offset in pixels for color ramp gradient labels.
   *
   * __Default value:__ `2`.
   */
  gradientLabelOffset?: number | SignalRef;

  /**
   * Default fill color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend.
   *
   * __Default value:__ `"transparent"`.
   */
  symbolBaseFillColor?: null | Color | SignalRef;

  /**
   * Default stroke color for legend symbols. Only applied if there is no `"fill"` scale color encoding for the legend.
   *
   * __Default value:__ `"gray"`.
   */
  symbolBaseStrokeColor?: null | Color | SignalRef;

  /**
   * The default direction (`"horizontal"` or `"vertical"`) for symbol legends.
   *
   * __Default value:__ `"vertical"`.
   */
  symbolDirection?: Orientation;

  /**
   * Border stroke dash pattern for the full legend.
   */
  strokeDash?: number[] | SignalRef;

  /**
   * Border stroke width for the full legend.
   */
  strokeWidth?: number | SignalRef;

  /**
   * Legend orient group layout parameters.
   */
  layout?: LegendLayout;
}

export interface BaseLegendLayout {
  /**
   * The anchor point for legend orient group layout.
   */
  anchor?: TitleAnchor | SignalRef;

  /**
   * The bounds calculation to use for legend orient group layout.
   */
  bounds?: LayoutBounds;

  /**
   * A flag to center legends within a shared orient group.
   */
  center?: boolean | SignalRef;

  /**
   * The layout direction for legend orient group layout.
   */
  direction?: Orientation | SignalRef;

  /**
   * The pixel margin between legends within a orient group.
   */
  margin?: number | SignalRef;

  /**
   * The pixel offset from the chart body for a legend orient group.
   */
  offset?: number | SignalRef;
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

export type TitleConfig = ExcludeMappedValueRef<BaseTitle>;

export type ProjectionConfig = ExcludeMappedValueRef<BaseProjection>;

export interface RangeConfig {
  /**
   * Default [color scheme](https://vega.github.io/vega/docs/schemes/) for categorical data.
   */
  category?: RangeScheme | string[];
  /**
   * Default [color scheme](https://vega.github.io/vega/docs/schemes/) for diverging quantitative ramps.
   */
  diverging?: RangeScheme | string[];
  /**
   * Default [color scheme](https://vega.github.io/vega/docs/schemes/) for quantitative heatmaps.
   */
  heatmap?: RangeScheme | string[];
  /**
   * Default [color scheme](https://vega.github.io/vega/docs/schemes/) for rank-ordered data.
   */
  ordinal?: RangeScheme | string[];
  /**
   * Default [color scheme](https://vega.github.io/vega/docs/schemes/) for sequential quantitative ramps.
   */
  ramp?: RangeScheme | string[];
  /**
   * Array of [symbol](https://vega.github.io/vega/docs/marks/symbol/) names or paths for the default shape palette.
   */
  symbol?: SymbolShape[];
}
