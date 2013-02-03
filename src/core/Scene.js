vg.Scene = (function() {
  function scene() {
    this._model = null;
    this._scales = {};
    this._axes = [];
    this._data = {};
    this._root = null;
  }
  
  var prototype = scene.prototype;
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
    return this;
  };
  
  prototype.data = function(data) {
    if (!arguments.length) return this._data;
    var dat = this._data,
        tx = this._model ? this._model.data.flow : {};
    vg.keys(data).forEach(function(k) {
      dat[k] = tx[k] ? tx[k].call(dat, data[k]) : data[k];
    });
    return this;
  };
  
  prototype.root = function(node) {
    if (!arguments.length) return this._root;
    this._root = node;
    return this;
  };
  
  prototype.build = function() {
    this._root = vg.scene.build.call(this,
      this._model.marks, this._data, this._root);
    vg.parse.scales(this._model.scales, this._scales, this._data);
    vg.parse.axes(this._model.axes, this._axes, this._scales);
    return this;
  };
  
  prototype.encode = function(request, item) {
    vg.scene.encode.call(this, this._root,
      this._model.marks, null, request, item);
    return this;
  };
  
  prototype.visit = function(pre, post) {
    return vg.scene.visit(this._root, pre, post);
  };
  
  return scene;
})();