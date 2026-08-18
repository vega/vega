let view = null;

self.addEventListener('message', async event => {
  try {
    if (event.data.type === 'pixelRatio' && view) {
      view.scaleFactor(event.data.pixelRatio);
      await view.resize().runAsync();
      return;
    }

    const {canvas, spec, vegaPath, pixelRatio} = event.data;

    // the bundle registers itself on the worker global as self.vega
    await import(vegaPath);
    const vega = self.vega;

    // renderer defaults to 'canvas' when a canvas is provided
    view = new vega.View(vega.parse(spec), {canvas, scaleFactor: pixelRatio});
    await view.runAsync();

    self.postMessage({type: 'success', message: 'Rendered in a Web Worker.'});
  } catch (error) {
    self.postMessage({type: 'error', message: error.message});
  }
});
