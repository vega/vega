vg.scene = {};

vg.scene.GROUP  = "group",
vg.scene.ENTER  = 0,
vg.scene.UPDATE = 1,
vg.scene.EXIT   = 2;

vg.scene.DEFAULT_DATA = {"sentinel":1}

vg.scene.bounds = function(path) {
  var b = new vg.Bounds(path[0].bounds), i, len;
  for (i=2, len=path.length; i<len; ++i) {
    b.translate(path[i].x || 0, path[i].y || 0);
  }
  return b;
};

vg.scene.data = function(data, parentData) {
  var DEFAULT = vg.scene.DEFAULT_DATA;

  // if data is undefined, inherit or use default
  data = vg.values(data || parentData || [DEFAULT]);

  // if inheriting default data, ensure its in an array
  if (data === DEFAULT) data = [DEFAULT];
  
  return data;
};