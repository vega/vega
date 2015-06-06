var dl = require('datalib');

function ImageLoader() {
  this._loading = 0;
  this._config = null; // TODO! load config
}

var prototype = ImageLoader.prototype;

prototype.pending = function() {
  return this._loading;
};

prototype.params = function(uri) {
  return dl.extend({url: uri}, this._config);
};

function browser(uri, callback) {
  var url = dl.load.sanitizeUrl(this.params(uri));
  if (!url) { // error
    if (callback) callback(uri, null);
    return null;
  }
  
  var loader = this,
      image = new Image();

  loader._loading += 1;

  image.onload = function() {
    loader._loading -= 1;
    image.loaded = true;
    if (callback) callback(null, image);
  };
  image.src = url;

  return image;
}

function file(uri, callback) {
  var loader = this,
      image = new (require('canvas').Image)();

  loader._loading += 1;

  dl.load(this.params(uri), function(err, data) {
    loader._loading -= 1;
    if (err) {
      if (callback) callback(err, null);
      return null;
    }
    image.src = data;
    image.loaded = true;
    if (callback) callback(null, image);
  });

  return image;
}

prototype.loadImage = function(uri, callback) {
  return dl.isNode ?
    file.call(this, uri, callback) :
    browser.call(this, uri, callback);
};

module.exports = ImageLoader;
