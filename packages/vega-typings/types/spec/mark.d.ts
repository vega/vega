import * as Encode from './encode';
import { SortOrder } from './scale';
import { Scope } from './scope';
import { SignalRef } from './signal';
import { Transform } from './transform';
import { OnMarkTrigger } from './on-trigger';
export type Facet =
  | {
      name: string;
      data: string;
      field: string;
    }
  | {
      name: string;
      data: string;
      groupby: string | string[];
      aggregate?: {
        cross?: boolean;
        fields: string[];
        ops: string[];
        as: string[];
      };
    };
export interface From {
  data?: string;
}
export type FromFacet =
  | From
  | (From & {
      facet: Facet;
    });
export type Clip =
  | boolean
  | {
      path: string | SignalRef;
    }
  | {
      sphere: string | SignalRef;
    };
export type Compare =
  | {
      field: string | SignalRef;
      order?: SortOrder;
    }
  | {
      field: (string | SignalRef)[];
      order?: SortOrder[];
    };
export interface BaseMark {
  role?: string;
  name?: string;
  description?: string;
  key?: string;
  clip?: Clip;
  sort?: Compare;
  interactive?: boolean;
  from?: From;
  transform?: Transform[];
  zindex?: number;
  on?: OnMarkTrigger[];
}
export interface ArcMark extends BaseMark, Encode.Encode<Encode.ArcEncodeEntry> {
  type: 'arc';
}
export interface AreaMark extends BaseMark, Encode.Encode<Encode.AreaEncodeEntry> {
  type: 'area';
}
export interface ImageMark extends BaseMark, Encode.Encode<Encode.ImageEncodeEntry> {
  type: 'image';
}
export interface GroupMark extends BaseMark, Scope, Encode.Encode<Encode.GroupEncodeEntry> {
  type: 'group';
  from?: FromFacet;
}
export interface LineMark extends BaseMark, Encode.Encode<Encode.LineEncodeEntry> {
  type: 'line';
}
export interface PathMark extends BaseMark, Encode.Encode<Encode.PathEncodeEntry> {
  type: 'path';
}
export interface RectMark extends BaseMark, Encode.Encode<Encode.RectEncodeEntry> {
  type: 'rect';
}
export interface RuleMark extends BaseMark, Encode.Encode<Encode.RuleEncodeEntry> {
  type: 'rule';
}
export interface ShapeMark extends BaseMark, Encode.Encode<Encode.ShapeEncodeEntry> {
  type: 'shape';
}
export interface SymbolMark extends BaseMark, Encode.Encode<Encode.SymbolEncodeEntry> {
  type: 'symbol';
}
export interface TextMark extends BaseMark, Encode.Encode<Encode.TextEncodeEntry> {
  type: 'text';
}
export interface TrailMark extends BaseMark, Encode.Encode<Encode.TrailEncodeEntry> {
  type: 'trail';
}
export type Mark =
  | ArcMark
  | AreaMark
  | ImageMark
  | GroupMark
  | LineMark
  | PathMark
  | RectMark
  | RuleMark
  | ShapeMark
  | SymbolMark
  | TextMark
  | TrailMark;

export interface VgMarkConfig {
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
  orient?: Encode.Orientation;

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
  interpolate?: Encode.Interpolate;
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
  shape?: string;

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
  align?: Encode.Align;

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
  baseline?: Encode.TextBaseline;

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
  fontStyle?: Encode.FontStyle;
  /**
   * The font weight.
   * This can be either a string (e.g `"bold"`, `"normal"`) or a number (`100`, `200`, `300`, ..., `900` where `"normal"` = `400` and `"bold"` = `700`).
   */
  fontWeight?: Encode.FontWeight;

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
