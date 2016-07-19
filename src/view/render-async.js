/**
 * Perform asynchronous rendering and return the renderer via callback.
 */
export default function(renderer, scene, callback) {
  var redraw = false;

  function poll() {
    if (renderer.pendingImages() === 0) {
      try {
        if (redraw) renderer.render(scene);
        callback(null, renderer);
      } catch (error) {
        callback(error);
      }
    } else {
      redraw = true;
      setTimeout(poll, 10);
    }
  }

  try {
    renderer.render(scene);
  } catch (error) {
    callback(error);
  }

  poll();
}
