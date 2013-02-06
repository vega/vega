vg.data.read = function(data, format) {
  // TODO read formats other than JSON
  return vg.data.json(data, format);
};

vg.data.json = function(data, format) {
  var d = JSON.parse(data);
  if (format && format.property) {
    d = vg.accessor(format.property)(d);
  }
  return d;
};