// Web Worker that renders Vega visualizations using OffscreenCanvas

self.addEventListener("message", async (event) => {
  try {
    const { canvas, spec, vegaPath } = event.data;

    // Report progress
    self.postMessage({
      type: "progress",
      message: "Worker received canvas and spec...",
    });

    // Import Vega in the worker
    // Imports with side-effects
    await import(vegaPath);
    // await import("https://cdn.jsdelivr.net/npm/vega-interpreter@1");
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
    // Note: View automatically:
    // 1. Calls initialize() when canvas option is provided
    // 2. Injects offscreenCanvas factory for label transforms when using OffscreenCanvas
    const view = new vega.View(runtime, {
      canvas: canvas, // Pass OffscreenCanvas directly
      renderer: "canvas"
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
