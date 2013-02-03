vg.data.read = function(data, format) {
  // TODO read formats other than JSON
  return vg.data.json(data, format);
};

vg.data.json = function(data, format) {
  var d = JSON.parse(data);
  return (format && format.property) ? d[format.property] : d;
};