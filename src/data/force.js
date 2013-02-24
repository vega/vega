vg.data.force = function() {
  var layout = d3.layout.force(),
      links = null,
      linkDistance = 20,
      linkStrength = 1,
      charge = -30,
      iterations = 500,
      size = ["width", "height"],
      params = [
        "friction",
        "theta",
        "gravity",
        "alpha"
      ];

  function force(data, db, group) {    
    layout
      .size(vg.data.size(size, group))
      .nodes(data);
      
    if (links && db[links]) {
      layout.links(db[links]);
    }

    layout.start();      
    for (var i=0; i<iterations; ++i) {
      layout.tick();
    }
    layout.stop();
    
    return data;
  }

  force.links = function(dataSetName) {
    links = dataSetName;
    return force;
  };
  
  force.size = function(sz) {
    size = sz;
    return force;
  };
       
  force.linkDistance = function(field) {
    linkDistance = typeof field === 'number'
      ? field
      : vg.accessor(field);
    layout.linkDistance(linkDistance);
    return force;
  };

  force.linkStrength = function(field) {
    linkStrength = typeof field === 'number'
      ? field
      : vg.accessor(field);
    layout.linkStrength(linkStrength);
    return force;
  };
  
  force.charge = function(field) {
    charge = typeof field === 'number'
      ? field
      : vg.accessor(field);
    layout.charge(charge);
    return force;
  };
  
  force.iterations = function(iter) {
    iterations = iter;
    return force;
  };

  params.forEach(function(name) {
    force[name] = function(x) {
      layout[name](x);
      return force;
    }
  });

  return force;
};