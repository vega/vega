// Vega is loaded here, in the worker, rather than from a path supplied over
// postMessage, so message data never decides what code runs
const vegaPath = '../../../packages/vega/build/vega.js';

let view = null;
let pendingPixelRatio = null;

self.addEventListener('message', async event => {
  try {
    if (event.data.type === 'pixelRatio') {
      // a ratio arriving before init completes is applied once the view exists
      if (view) {
        view.scaleFactor(event.data.pixelRatio);
        await view.resize().runAsync();
      } else {
        pendingPixelRatio = event.data.pixelRatio;
      }
      return;
    }

    if (event.data.type !== 'init') return;
    const {canvas, spec, pixelRatio} = event.data;

    // the bundle registers itself on the worker global as self.vega
    await import(vegaPath);
    const vega = self.vega;

    view = new vega.View(vega.parse(spec), {canvas, scaleFactor: pixelRatio});
    if (pendingPixelRatio != null) {
      view.scaleFactor(pendingPixelRatio).resize();
      pendingPixelRatio = null;
    }
    await view.runAsync();

    self.postMessage({type: 'success', message: 'Rendered in a Web Worker.'});
  } catch (error) {
    self.postMessage({type: 'error', message: error.message});
  }
});
