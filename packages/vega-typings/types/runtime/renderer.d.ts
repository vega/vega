import { Loader } from '../index.js';

export type Renderers = 'canvas' | 'svg' | 'hybrid' | 'none';

export class Renderer {
  constructor(loader: Loader);
  initialize(el: HTMLElement, width: number, height: number, origin: readonly number[]): this;
  resize(width: number, height: number, origin: readonly number[]): this;
}

export interface RenderModule {
  renderer: typeof Renderer;
  headless?: Renderer;
  handler: Handler;
}

export function renderModule(moduleName: string, renderModule: RenderModule): RenderModule;

export class Handler {}

export class CanvasHandler extends Handler {}
