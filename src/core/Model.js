vg.Model = (function() {
  function model() {
    this._defs = null;
    this._axes = [];
    this._data = {};
    this._scales = {};
    this._scene = null;
  }
  
  var prototype = model.prototype;
  
  prototype.defs = function(defs) {
    if (!arguments.length) return this._defs;
    this._defs = defs;
    return this;
  };
  
  prototype.data = function(data) {
    if (!arguments.length) return this._data;
    var dat = this._data,
        tx = this._defs ? this._defs.data.flow : {};
    vg.keys(data).forEach(function(k) {
      dat[k] = tx[k] ? tx[k].call(dat, data[k]) : data[k];
    });
    return this;
  };
  
  prototype.scene = function(node) {
    if (!arguments.length) return this._scene;
    this._scene = node;
    return this;
  };
  
  prototype.build = function() {
    this._scene = vg.scene.build.call(this,
      this._defs.marks, this._data, this._scene);
    vg.parse.scales(this._defs.scales, this._scales, this._data);
    vg.parse.axes(this._defs.axes, this._axes, this._scales);
    return this;
  };
  
  prototype.encode = function(request, item) {
    vg.scene.encode.call(this, this._scene,
      this._defs.marks, null, request, item);
    return this;
  };
  
  prototype.visit = function(pre, post) {
    return vg.scene.visit(this._scene, pre, post);
  };
  
  return model;
})();