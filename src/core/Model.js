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

    var tx = this._defs.data.flow || {},
        keys = this._defs.data.defs.map(vg.accessor("name")),
        i, j, len, k, src;
        
    for (i=0, len=keys.length; i<len; ++i) {
      if (!data[k=keys[i]]) continue;
      
      this._data[k] = tx[k]
        ? tx[k](data[k], this._data, this._defs.marks)
        : data[k];
      
      src = this._defs.data.source[k] || [];
      for (j=0; j<src.length; ++j) {
        this._data[src[j]] = tx[src[j]]
          ? tx[src[j]](data[k], this._data, this._defs.marks)
          : data[k]
      }
    }

    return this;
  };
  
  prototype.scene = function(node) {
    if (!arguments.length) return this._scene;
    this._scene = node;
    return this;
  };
  
  prototype.build = function() {
    var m = this, data = m._data, marks = m._defs.marks;
    m._scene = vg.scene.build.call(m, marks, data, m._scene);
    return this;
  };
  
  prototype.encode = function(request, item) {
    var m = this,
        scales = m._scales,
        scene = m._scene,
        axes = m._axes,
        data = m._data,
        defs = m._defs;

    vg.parse.scales(defs.scales, scales, data, defs.marks);
    vg.parse.axes(defs.axes, axes, scales);
    vg.scene.encode.call(m, scene, defs.marks, null, request, item);
    return this;
  };
  
  prototype.visit = function(pre, post) {
    return vg.scene.visit(this._scene, pre, post);
  };
  
  return model;
})();