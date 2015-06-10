var dl = require('datalib');

function ImageLoader() {
  this._pending = 0;
  this._config = ImageLoader.Config; 
}

// Overridable global default load configuration
ImageLoader.Config = null;

ImageLoader.imageURL = function(uri) {
  return dl.load.sanitizeUrl(params(uri, ImageLoader.Config));
};

function params(uri, config) {
  return dl.extend({url: uri}, config);
};

var prototype = ImageLoader.prototype;

prototype.pending = function() {
  return this._pending;
};

function browser(uri, callback) {
  var url = dl.load.sanitizeUrl(params(uri, this._config));
  if (!url) { // error
    if (callback) callback(uri, null);
    return null;
  }
  
  var loader = this,
      image = new Image();

  loader._pending += 1;

  image.onload = function() {
    loader._pending -= 1;
    image.loaded = true;
    if (callback) callback(null, image);
  };
  image.src = url;

  return image;
}

function server(uri, callback) {
  var loader = this,
      image = new (require('canvas').Image)();

  loader._pending += 1;

  var p = params(uri, this._config);
  dl.load(p, function(err, data) {
    loader._pending -= 1;
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
    server.call(this, uri, callback) :
    browser.call(this, uri, callback);
};

module.exports = ImageLoader;
