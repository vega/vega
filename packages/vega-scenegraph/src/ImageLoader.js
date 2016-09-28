import Image from './util/canvas/image';
import {loader} from 'vega-loader';

export default function ImageLoader(imageLoader) {
  this._pending = 0;
  this._loader = imageLoader || loader();
}

var prototype = ImageLoader.prototype;

prototype.pending = function() {
  return this._pending;
};

prototype.loadImage = function(uri) {
  var loader = this;
  loader._pending += 1;

  return loader._loader.sanitize(uri, {context:'image'})
    .then(function(url) {
      if (!url || !Image) throw 'Image unsupported.';

      var image = new Image();

      image.onload = function() {
        loader._pending -= 1;
        image.loaded = true;
      };

      image.onerror = function() {
        loader._pending -= 1;
        image.loaded = false;
      }

      image.src = url;
      return image;
    })
    .catch(function() {
      loader._pending -= 1;
      return {loaded: false, width: 0, height: 0};
    });
};

prototype.ready = function() {
  var loader = this;
  return new Promise(function(accept) {
    function poll(value) {
      if (!loader._pending) accept(value);
      else setTimeout(function() { poll(true); }, 10);
    }
    poll(false);
  });
};
