const vegaPath = '../../../packages/vega/build/vega.js';
const statusEl = document.getElementById('status');

// https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas#browser_compatibility
if (typeof OffscreenCanvas === 'undefined') {
  showStatus('error', 'OffscreenCanvas is not supported in this browser.');
} else {
  run().catch(error => showStatus('error', 'Failed to start: ' + error.message));
}

function showStatus(type, message) {
  statusEl.className = type;
  statusEl.textContent = message;
}

async function run() {
  const response = await fetch('spec.json');
  const spec = await response.json();

  const canvas = document.getElementById('view');
  const pixelRatio = window.devicePixelRatio || 1;

  // scale the backing store for high-DPI displays; CSS keeps the layout size
  canvas.width = spec.width * pixelRatio;
  canvas.height = spec.height * pixelRatio;

  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('worker.js', {type: 'module'});
  worker.postMessage({canvas: offscreen, spec, vegaPath, pixelRatio}, [offscreen]);

  // keep the worker's scale factor in sync when the window moves between displays
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#monitoring_screen_resolution_or_zoom_level_changes
  const watchPixelRatio = () => {
    const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    media.addEventListener('change', () => {
      worker.postMessage({type: 'pixelRatio', pixelRatio: window.devicePixelRatio || 1});
      watchPixelRatio();
    }, {once: true});
  };
  watchPixelRatio();

  worker.addEventListener('message', event => showStatus(event.data.type, event.data.message));
  worker.addEventListener('error', error => showStatus('error', 'Worker error: ' + error.message));
}
