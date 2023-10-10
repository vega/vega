import CanvasHandler from './CanvasHandler';
import {inherits} from 'vega-util';
import {domChild} from './util/dom';

export default function HybridHandler(loader, tooltip) {
  CanvasHandler.call(this, loader, tooltip);
}

inherits(HybridHandler, CanvasHandler, {
  initialize(el, origin, obj) {
    const canvas = domChild(el, 0, 'div');
    return CanvasHandler.prototype.initialize.call(this, canvas, origin, obj);
  }
});
