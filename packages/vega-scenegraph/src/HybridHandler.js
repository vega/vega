import CanvasHandler from './CanvasHandler';
import {OPTS} from './HybridRenderer';
import {domChild} from './util/dom';

export default class HybridHandler extends CanvasHandler {
  constructor (loader, tooltip) {
    super(loader, tooltip);
  }

  initialize(el, origin, obj) {
    const canvas = domChild(domChild(el, 0, 'div'), OPTS.svgOnTop? 0: 1, 'div');
    return super.initialize(canvas, origin, obj);
  }
}
