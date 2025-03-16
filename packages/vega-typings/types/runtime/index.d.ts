import { LoggerInterface } from 'vega-util';
import {
  Color,
  Config,
  DataType,
  EncodeEntryName,
  Format,
  Padding,
  SignalValue,
  Spec
} from '../spec/index.js';
import { Changeset, Transform } from './dataflow.js';
import { Renderers } from './renderer.js';
import { Scene } from './scene.js';

export { Runtime } from './runtime.js';
import { Runtime } from './runtime.js';

export const version: string;

// Locale API
export function formatLocale(definition: object): void;
export function timeFormatLocale(definition: object): void;

// Parser
export function parse(spec: Spec, config?: Config, opt?: { ast?: boolean }): Runtime;

/** Types documented in vega-loader's README.md */
type BaseLoaderOptions = {
  /** Base URL prefix prepended to provided URI */
  baseUrl: string;
  /** Allows caller to explicitly set loading mode (local or network request). File mode only applies to server-side rendering. */
  mode: 'file' | 'http';
  /** Default protocol for protocol-relative URIs, defaults to HTTP */
  defaultProtocol: 'file' | 'http' | string;
  /** browser `target` attribute for hyperlinks. Only used when sanitizing URI values for use as hyperlink */
  target: string;
  /** browser `rel` attribute for hyperlinks. Only used when sanitizing URI values for use as hyperlink */
  rel: string;
  /** http request parameters passed to underlying [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) */
  http: RequestInit;
  /**
   * Specify a [crossOrigin](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image) attribute for images. Only used when sanitizing URI values with option context: "image"
   * If this property is defined and maps to a value of `null` or `undefined`, then a `no-cors` fetch will be performed for the `Image`. This property can be used to override Vega's default behavior of using `crossOrigin="anonymous"`, which allows images loaded from a different host to be included in exported visualization images (and thereby avoid "tainted canvas errors"), so long as the server provides permission via proper CORS headers.
   */
  crossOrigin: 'anonymous' | 'use-credentials' | '' | undefined;
};

/**
 * Informs loader which context the URI will be used in.
 */
type LoaderOptionsWithContext =
  | (Partial<BaseLoaderOptions> & {
      /**
       * Describes context in which the URI will be used.
       */
      context: 'href' | 'image';
    })
  | {
      /**
       * context:dataflow is used when loader is used for getting data into vega-dataflow
       * https://vega.github.io/vega/docs/data/
       */
      context: 'dataflow';
      /**
       * File formats supported by vega-loader
       * https://vega.github.io/vega-lite/docs/data.html#format
       */
      response: 'json' | 'csv' | 'tsv' | 'dsv' | 'topojson';
    };

/**
 * Loader object is used for loading data, images, and links (hrefs) from a Uniform Resource Identifier (URI)
 * https://github.com/vega/vega/tree/main/packages/vega-loader
 */
export interface Loader {
  load: (uri: string, options?: LoaderOptionsWithContext) => Promise<string>;
  sanitize: (uri: string, options: LoaderOptionsWithContext) => Promise<{ href: string }>;
  http: (uri: string, options: Partial<RequestInit>) => Promise<string>;
  file: (filename: string) => Promise<string>;
}

export type NumberFormat = (number: number) => string;
export type TimeFormat = (date: Date | number) => string;
export type TimeParse = (dateString: string) => Date;

export interface LocaleFormatters {
  format: (spec: string) => NumberFormat;
  formatPrefix: (spec: string, value: number) => NumberFormat;
  formatFloat: (spec: string) => NumberFormat;
  formatSpan: (start: number, stop: number, count: number, spec: string) => NumberFormat;
  timeFormat: (spec: string) => TimeFormat;
  utcFormat: (spec: string) => TimeFormat;
  timeParse: (spec: string) => TimeParse;
  utcParse: (spec: string) => TimeParse;
}

export interface ToCanvasOptions {
  type?: string;
  context?: any;
  externalContext?: any;
}

export interface ViewOptions {
  background?: Color;
  bind?: Element | string;
  container?: Element | string;
  hover?: boolean;
  loader?: Loader;
  logger?: LoggerInterface;
  logLevel?: number;
  renderer?: Renderers;
  tooltip?: TooltipHandler;
  locale?: LocaleFormatters;
  expr?: any;
  watchPixelRatio?: boolean;
}

export class View {
  constructor(runtime: Runtime, opt?: ViewOptions);

  // View Configuration

  initialize(container?: Element | string, bindContainer?: Element | string): this;

  finalize(): this;

  loader(loader: Loader): this;
  loader(): Loader;

  logLevel(level: number): this;
  logLevel(): number;

  logger(logger: LoggerInterface): this;
  logger(): LoggerInterface;

  renderer(renderer: Renderers): this;
  renderer(): Renderers;

  tooltip(handler: TooltipHandler): this;

  hover(hoverSet?: EncodeEntryName, leaveSet?: EncodeEntryName): this;

  description(s: string): this;
  description(): string;

  background(s: Color): this;
  background(): Color;

  width(w: number): this;
  width(): number;
  height(h: number): this;
  height(): number;

  padding(p: Padding): this;
  padding(): Padding;

  resize(): this;

  // Dataflow and Rendering

  runAsync(): Promise<View>;

  run(encode?: string): this;

  runAfter(callback: (view: this) => void, enqueue?: boolean, priority?: number): this;

  dirty(item: any): void;

  container(): HTMLElement | null;

  scenegraph(): Scene;

  origin(): [number, number];

  // Signals

  signal(name: string, value: SignalValue): this;
  signal(name: string): SignalValue;

  getState(options?: {
    signals?: (name?: string, operator?: any) => boolean;
    data?: (name?: string, object?: any) => boolean;
    recurse?: boolean;
  }): { signals?: any; data?: any };
  setState(state: { signals?: any; data?: any }): this;

  addSignalListener(name: string, handler: SignalListenerHandler): this;
  removeSignalListener(name: string, handler: SignalListenerHandler): this;

  // Event Handling

  events(source: any, type: any, filter?: (_: any) => boolean): any;

  addEventListener(type: string, handler: EventListenerHandler): this;
  removeEventListener(type: string, handler: EventListenerHandler): this;

  addResizeListener(handler: ResizeHandler): this;
  removeResizeListener(handler: ResizeHandler): this;

  globalCursor(flag: boolean): any;

  preventDefault(flag: boolean): void;

  // Image Export

  toCanvas(scaleFactor?: number, options?: ToCanvasOptions): Promise<HTMLCanvasElement>;
  toSVG(scaleFactor?: number): Promise<string>;
  toImageURL(type: string, scaleFactor?: number): Promise<string>;

  // Data and Scales
  scale(name: string): any;

  data(name: string): any[];
  data(name: string, tuples: any): this;

  addDataListener(name: string, handler: DataListenerHandler): this;
  removeDataListener(name: string, handler: DataListenerHandler): this;

  change(name: string, changeset: Changeset): this;
  insert(name: string, tuples: any): this;
  remove(name: string, tuples: any): this;

  // Undocumented (https://github.com/vega/vega/issues/2844, https://github.com/vega/vega/issues/2845)

  locale(locale: LocaleFormatters): this;
  locale(): LocaleFormatters;

  changeset(): Changeset;
}

export type ScenegraphEvent = MouseEvent | TouchEvent | KeyboardEvent;

export interface LoaderOptions {
  baseURL?: string;
  mode?: 'file' | 'http';
  defaultProtocol?: 'http' | 'https' | string;
  target?: string;
  http?: RequestInit;
}
export function loader(opt?: LoaderOptions): Loader;
export function read(
  data: string,
  schema: Format,
  dateParse?: (dateString: string) => Date
): object[];

export type TypeInference = DataType | 'integer';
export function inferType(values: readonly any[], field?: string): TypeInference;
export function inferTypes(
  values: readonly any[],
  fields: readonly string[]
): { [field: string]: TypeInference };

export type EventListenerHandler = (event: ScenegraphEvent, item?: Item | null) => void;
export type SignalListenerHandler = (name: string, value: SignalValue) => void;
export type DataListenerHandler = (name: string, value: any) => void;
export type ResizeHandler = (width: number, height: number) => void;
export type TooltipHandler = (handler: any, event: MouseEvent, item: Item, value: any) => void;

export interface Item<T = any> {
  /**
   * The underlying data element to which this item corresponds.
   */
  datum: T;
  /**
   * The mark to which this item belongs.
   */
  mark: RuntimeMark;
}

export type RuntimeMark =
  | DefineMark<'group'>
  | DefineMark<'rect', { x: number; y: number; width: number; height: number; fill: number }>
  | DefineMark<'symbol', {}, 'legend-symbol'>
  | DefineMark<'path'>
  | DefineMark<'arc'>
  | DefineMark<'area'>
  | DefineMark<'line'>
  | DefineMark<'image'>
  | DefineMark<'text', {}, 'axis-label' | 'legend-label'>;

export interface DefineMark<T extends string, I = {}, R extends string = never> {
  marktype: T;
  role: 'mark' | R;
  items: Item<I>[];
  group: any;
}

// Extensibility: https://vega.github.io/vega/docs/api/extensibility/

export function projection(type: string, projection: any): View;

export function scale(type: string, scale?: any): any;

export function scheme(name: string, scheme?: any): any;
export function schemeDiscretized(name: string, scheme?: any, interpolator?: any): any;

export function expressionFunction(name: string, fn?: any, visitor?: any): any;

export const transforms: { [name: string]: Transform };

export function resetSVGDefIds(): void;

export { parseSelector } from 'vega-event-selector';
export { codegenExpression, parseExpression } from 'vega-expression';
export * from 'vega-util';
export * from './dataflow.js';
export * from './renderer.js';
export * from './scene.js';
