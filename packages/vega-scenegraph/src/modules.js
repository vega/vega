import CanvasHandler from './CanvasHandler';
import CanvasRenderer from './CanvasRenderer';
import SVGHandler from './SVGHandler';
import SVGRenderer from './SVGRenderer';
import SVGStringRenderer from './SVGStringRenderer';
import HybridRenderer from './HybridRenderer';
import HybridHandler from './HybridHandler';

const Canvas = 'canvas';
const Hybrid = 'hybrid';
const PNG = 'png';
const SVG = 'svg';
const None = 'none';

export const RenderType = {
  Canvas: Canvas,
  PNG:    PNG,
  SVG:    SVG,
  Hybrid: Hybrid,
  None:   None
};

const modules = {};

modules[Canvas] = modules[PNG] = {
  renderer: CanvasRenderer,
  headless: CanvasRenderer,
  handler:  CanvasHandler
};

modules[SVG] = {
  renderer: SVGRenderer,
  headless: SVGStringRenderer,
  handler:  SVGHandler
};

modules[Hybrid] = {
  renderer: HybridRenderer,
  headless: HybridRenderer,
  handler:  HybridHandler
};

modules[None] = {};

export function renderModule(name, _) {
  name = String(name || '').toLowerCase();
  if (arguments.length > 1) {
    modules[name] = _;
    return this;
  } else {
    return modules[name];
  }
}
