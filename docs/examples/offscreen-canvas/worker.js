// Web Worker that renders Vega visualizations using OffscreenCanvas

// Store view reference for pixel ratio updates
let view = null;

self.addEventListener("message", async (event) => {
  try {
    // Handle pixel ratio updates
    if (event.data.type === 'pixelRatio' && view) {
      console.log(`Worker received pixel ratio update: ${event.data.pixelRatio}`);
      // Update scale factor and trigger resize
      view.scaleFactor(event.data.pixelRatio);
      await view.resize().runAsync();
      return;
    }

    const { canvas, spec, vegaPath, pixelRatio } = event.data;

    // Report progress
    self.postMessage({
      type: "progress",
      message: "Worker received canvas and spec...",
    });

    // Import Vega in the worker
    // Imports with side-effects
    await import(vegaPath);
    const vega = self.vega;

    self.postMessage({
      type: "progress",
      message: "Vega loaded, parsing spec...",
    });

    // Parse the Vega specification
    const runtime = vega.parse(spec);

    self.postMessage({
      type: "progress",
      message: "Spec parsed, creating View with OffscreenCanvas...",
    });

    // Create a View with the OffscreenCanvas
    // Pass pixelRatio from main thread to ensure correct resolution
    // Note: renderer defaults to 'canvas' when a canvas is provided
    view = new vega.View(runtime, {
      canvas: canvas,
      scaleFactor: pixelRatio  // Set pixel ratio for high-DPI displays
    });

    self.postMessage({
      type: "progress",
      message: "View created, running visualization...",
    });

    // Run the visualization
    await view.runAsync();

    self.postMessage({
      type: "success",
      message: "Rendered successfully! Check the canvas above.",
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
});

// Log that worker is ready
console.log("Vega worker initialized and ready");
