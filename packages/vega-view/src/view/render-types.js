import {
  CanvasRenderer,
  CanvasHandler,
  SVGRenderer,
  SVGHandler,
  SVGStringRenderer
} from 'vega-scenegraph';

var modules = {
  canvas: {
    renderer: CanvasRenderer,
    headless: CanvasRenderer,
    handler:  CanvasHandler
  },
  svg: {
    renderer: SVGRenderer,
    headless: SVGStringRenderer,
    handler:  SVGHandler
  },
  none: {}
};
modules.png = modules.canvas;

export function rendererModule(name, _) {
  name = String(name || '').toLowerCase();
  return arguments.length > 1 ? (modules[name] = _, this) : modules[name];
}

export var Canvas = 'canvas';
export var PNG = 'png';
export var SVG = 'svg';
export var None = 'none';
