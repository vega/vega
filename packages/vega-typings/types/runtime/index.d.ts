import { LoggerInterface } from 'vega-util';
import {
  Color,
  Config,
  DataType,
  EncodeEntryName,
  Format,
  Padding,
  SignalValue,
  Spec,
} from '../spec';
import { Changeset, Transform } from './dataflow';
import { Renderers } from './renderer';
import { Scene } from './scene';

export { Runtime } from './runtime';
import { Runtime } from './runtime';

export const version: string;

// Locale API
export function formatLocale(definition: object): void;
export function timeFormatLocale(definition: object): void;

// Parser
export function parse(spec: Spec, config?: Config, opt?: { ast?: boolean }): Runtime;

export interface Loader {
  load: (uri: string, options?: any) => Promise<string>;
  sanitize: (uri: string, options: any) => Promise<{ href: string }>;
  http: (uri: string, options: any) => Promise<string>;
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
  dateParse?: (dateString: string) => Date,
): object[];

export type TypeInference = DataType | 'integer';
export function inferType(values: readonly any[], field?: string): TypeInference;
export function inferTypes(
  values: readonly any[],
  fields: readonly string[],
): { [field: string]: TypeInference };

export type EventListenerHandler = (event: ScenegraphEvent, item?: Item) => void;
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

export { parseSelector } from 'vega-event-selector';
export { codegenExpression, parseExpression } from 'vega-expression';
export * from 'vega-util';
export * from './dataflow';
export * from './renderer';
export * from './scene';
