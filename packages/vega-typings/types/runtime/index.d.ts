import { Spec } from '..';

// TODO
export type Runtime = any;

export const version: string;

// Locale API
export function formatLocale(definition: object): void;
export function timeFormatLocale(definition: object): void;

export function parse(spec: Spec, opt?: any): Runtime;

export interface Loader {
  load: (uri: string, options?: any) => Promise<string>;
  sanitize: (uri: string, options: any) => Promise<{ href: string }>;
  http: (uri: string, options: any) => Promise<string>;
  file: (filename: string) => Promise<string>;
}

export class View {
  constructor(runtime: Runtime, config?: any);
  initialize(dom?: Element | string): View;
  finalize(): void;
  logLevel(level: number): View;
  renderer(renderer: 'canvas' | 'svg' | 'none'): View;
  loader(loader: Loader): View;

  hover(): View;
  run(): View;
  runAsync(): Promise<View>;
  change(name: string, changeset: any): View;
  changeset(): any;
  data(name: string): object[];

  width(): number;
  width(w: number): View;
  height(): number;
  height(h: number): View;
  padding(p: number | { left?: number; right?: number; top?: number; bottom?: number }): View;

  toImageURL(type: string, scaleFactor?: number): Promise<string>;
  toSVG(): Promise<string>;
  toCanvas(): Promise<any>; // TODO node-canvas result

  signal(name: string, value: any): View;
  signal(name: string): any;
  container(): HTMLElement | null;
  addEventListener(type: string, handler: EventListenerHandler): View;
  removeEventListener(type: string, handler: EventListenerHandler): View;
  addSignalListener(name: string, handler: SignalListenerHandler): View;
  removeSignalListener(name: string, handler: SignalListenerHandler): View;
  addResizeListener(handler: ResizeHandler): View;
  removeResizeListener(handler: ResizeHandler): View;
  tooltip(handler: TooltipHandler): View;

  getState(options?: {
    signals?: (name?: string, operator?: any) => boolean;
    data?: (name?: string, object?: any) => boolean;
    recurse?: boolean;
  }): { signals?: any; data?: any };
  setState(state: { signals?: any; data?: any }): View;
}

export type ScenegraphEvent = MouseEvent | TouchEvent | KeyboardEvent;

export const Warn: number;
export const changeset: any;
export function loader(opt?: any): Loader;
export type EventListenerHandler = (event: ScenegraphEvent, item?: Item) => void;
export type SignalListenerHandler = (name: string, value: any) => void;
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

export function projection(type: string, projection: any): View;

export * from 'vega-util';
