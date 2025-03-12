import {image} from 'vega-canvas';
import {loader} from 'vega-loader';
import {hasOwnProperty} from 'vega-util';

export default class ResourceLoader {
  constructor(customLoader) {
    this._pending = 0;
    this._loader = customLoader || loader();
  }

  pending() {
    return this._pending;
  }

  sanitizeURL(uri) {
    const loader = this;
    increment(loader);

    return loader._loader.sanitize(uri, { context: 'href' })
      .then(opt => {
        decrement(loader);
        return opt;
      })
      .catch(() => {
        decrement(loader);
        return null;
      });
  }

  loadImage(uri) {
    const loader = this, Image = image();
    increment(loader);

    return loader._loader
      .sanitize(uri, { context: 'image' })
      .then(opt => {
        const url = opt.href;
        if (!url || !Image) throw { url: url };

        const img = new Image();

        // set crossOrigin only if cors is defined; empty string sets anonymous mode
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/crossOrigin
        const cors = hasOwnProperty(opt, 'crossOrigin') ? opt.crossOrigin : 'anonymous';
        if (cors != null) img.crossOrigin = cors;

        // attempt to load image resource
        img.onload = () => decrement(loader);
        img.onerror = () => decrement(loader);
        img.src = url;

        return img;
      })
      .catch(e => {
        decrement(loader);
        return { complete: false, width: 0, height: 0, src: e && e.url || '' };
      });
  }

  ready() {
    const loader = this;
    return new Promise(accept => {
      function poll(value) {
        if (!loader.pending()) accept(value);
        else setTimeout(() => { poll(true); }, 10);
      }
      poll(false);
    });
  }
}

function increment(loader) {
  loader._pending += 1;
}

function decrement(loader) {
  loader._pending -= 1;
}
