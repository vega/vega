import {resetSVGGradientId} from './src/Gradient.js';
import {resetSVGClipId} from './src/util/svg/clip.js';

export {default as Bounds} from './src/Bounds.js';
export {default as Gradient} from './src/Gradient.js';
export {default as GroupItem} from './src/GroupItem.js';
export {default as ResourceLoader} from './src/ResourceLoader.js';
export {default as Item} from './src/Item.js';
export {default as Scenegraph} from './src/Scenegraph.js';

export {default as Handler} from './src/Handler.js';
export {default as Renderer} from './src/Renderer.js';
export {default as CanvasHandler} from './src/CanvasHandler.js';
export {default as CanvasRenderer} from './src/CanvasRenderer.js';
export {default as SVGHandler} from './src/SVGHandler.js';
export {default as SVGRenderer} from './src/SVGRenderer.js';
export {default as SVGStringRenderer} from './src/SVGStringRenderer.js';
export {default as HybridRenderer, setHybridRendererOptions} from './src/HybridRenderer.js';
export {default as HybridHandler} from './src/HybridHandler.js';
export {RenderType, renderModule} from './src/modules.js';
export {intersect} from './src/intersect.js';

export {default as Marks} from './src/marks/index.js';

export {default as boundClip} from './src/bound/boundClip.js';
export {default as boundContext} from './src/bound/boundContext.js';
export {default as boundStroke} from './src/bound/boundStroke.js';
export {default as boundItem} from './src/bound/boundItem.js';
export {default as boundMark} from './src/bound/boundMark.js';

export {default as pathCurves} from './src/path/curves.js';
export {default as pathSymbols} from './src/path/symbols.js';
export {default as pathRectangle} from './src/path/rectangle.js';
export {default as pathTrail} from './src/path/trail.js';
export {default as pathParse} from './src/path/parse.js';
export {default as pathRender} from './src/path/render.js';

export {default as point} from './src/util/point.js';
export {domCreate, domFind, domChild, domClear} from './src/util/dom.js';
export {markup, serializeXML} from './src/util/markup.js';
export {
  font,
  fontFamily,
  fontSize,
  lineHeight,
  multiLineOffset,
  textMetrics
} from './src/util/text.js';

export {sceneEqual, pathEqual} from './src/util/equal.js';
export {sceneToJSON, sceneFromJSON} from './src/util/serialize.js';
export {
  intersectPath,
  intersectPoint,
  intersectRule,
  intersectBoxLine
} from './src/util/intersect.js';
export {
  zorder as sceneZOrder,
  visit as sceneVisit,
  pickVisit as scenePickVisit
} from './src/util/visit.js';

// for testing purposes
export {path} from 'd3-path';

export function resetSVGDefIds() {
  resetSVGClipId();
  resetSVGGradientId();
}
