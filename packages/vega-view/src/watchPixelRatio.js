export default function() {
  // based on https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#monitoring_screen_resolution_or_zoom_level_changes
  if (this.renderer() === 'canvas' && this._renderer._canvas) {
    let remove = null;
    const updatePixelRatio = () => {
      if (remove != null) {
        remove();
      }
      const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      media.addEventListener('change', updatePixelRatio);
      remove = () => {
        media.removeEventListener('change', updatePixelRatio);
      };

      this._renderer._canvas.getContext('2d').pixelRatio = window.devicePixelRatio || 1;
      this._redraw = true;
      this._resize = 1;
      this.resize().runAsync();
    };
    updatePixelRatio();
  }
}