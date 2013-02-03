vg.data.geopath = function() {
  var geopath = d3.geo.path(),
      projection = "mercator",
      geojson = vg.identity,
      opt = {},
      path = "path";

  var map = vg.data.mapper(function(d) {
    d[path] = geopath(geojson(d));
    return d;
  });
  
  map.projection = function(proj) {
    if (projection !== proj) {
      projection = proj;
      var p = d3.geo[projection]();
      for (var name in opt) {
        p[name](opt[name]);
      }
      geopath.projection(p);
    }
    return map;
  };
  
  vg.data.geo.params.forEach(function(name) {
    map[name] = function(x) {
      opt[name] = x;
      (geopath.projection())[name](x);
      return map;
    }
  });
   
  map.field = function(field) {
    geojson = vg.accessor(field);
    return map;
  };

  map.path = function(field) {
    path = field;
    return map;
  };

  return map;
};