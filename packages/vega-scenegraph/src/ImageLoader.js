import Image from './util/canvas/image';
import {load} from 'vega-loader';

export default function ImageLoader(loadConfig) {
  this._pending = 0;
  this._config = loadConfig || ImageLoader.Config;
}

// Overridable global default load configuration
ImageLoader.Config = {};

var prototype = ImageLoader.prototype;

prototype.pending = function() {
  return this._pending;
};

prototype.imageURL = function(uri) {
  return load.sanitize(uri, this._config);
};

prototype.loadImage = function(uri) {
  var url = this.imageURL(uri);

  if (!url || !Image) {
    return {loaded: false, width: 0, height: 0};
  }

  var loader = this,
      image = new Image();

  loader._pending += 1;

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
