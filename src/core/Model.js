vg.Model = (function() {
  function model() {
    this._defs = null;
    this._data = {};
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
          ? tx[src[j]](this._data[k], this._data, this._defs.marks)
          : this._data[k]
      }
    }

    return this;
  };
  
  prototype.width = function(width) {
    if (this._defs) this._defs.width = width;
    if (this._defs && this._defs.marks) this._defs.marks.width = width;
    if (this._scene) this._scene.items[0].width = width;
    return this;
  };
  
  prototype.height = function(height) {
    if (this._defs) this._defs.height = height;
    if (this._defs && this._defs.marks) this._defs.marks.height = height;
    if (this._scene) this._scene.items[0].height = height;
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
    m._scene.items[0].width = marks.width;
    m._scene.items[0].height = marks.height;
    m._scene.interactive = false;
    return this;
  };
  
  prototype.encode = function(trans, request, item) {
    var m = this, scene = m._scene, defs = m._defs;
    vg.scene.encode.call(m, scene, defs.marks, trans, request, item);
    return this;
  };
  
  return model;
})();