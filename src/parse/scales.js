vg.parse.scales = (function() {
  var LINEAR = "linear",
      ORDINAL = "ordinal",
      LOG = "log",
      POWER = "pow",
      VARIABLE = {width: 1, height: 1},
      PREDEFINED = {category10: 1, category20: 1};

  function scales(spec, scales, db, group) {
    return (spec || []).reduce(function(o, def) {
      o[def.name] = scale(def, o[def.name], db, group);
      return o;
    }, scales || {});
  }

  function scale(def, scale, db, group) {
    var type = def.type || LINEAR,
        s = scale || d3.scale[type](),
        rng = range(def, group),
        m = (type===ORDINAL ? ordinal : quantitative),
        data = vg.values(group.datum);
    
    m(def, s, rng, db, data);
    return s;
  }
  
  function ordinal(def, scale, rng, db, data) {
    var domain, dat, get, str;
    
    // domain
    domain = def.domain;
    if (Array.isArray(domain)) {
      scale.domain(domain);
    } else if (vg.isObject(domain)) {
      dat = db[domain.data] || data;
      get = vg.accessor(domain.field);      
      scale.domain(vg.unique(dat, get));
    }

    // range
    str = typeof rng[0] === 'string';
    if (str || rng.length > 2) {
      scale.range(rng); // color or shape values
    } else if (def.points) {
      scale.rangePoints(rng, def.padding||0);
    } else if (def.round || def.round===undefined) {
      scale.rangeRoundBands(rng, def.padding||0);
    } else {
      scale.rangeBands(rng, def.padding||0);
    }
  }
  
  function quantitative(def, scale, rng, db, data) {
    var domain, dat, get;
    
    // domain
    domain = [null, null];
    if (def.domain !== undefined) {
      if (Array.isArray(def.domain)) {
        domain = def.domain.slice();
      } else if (vg.isObject(def.domain)) {
        dat = db[def.domain.data] || data;
        get = vg.accessor(def.domain.field);
        domain[0] = d3.min(dat, get);
        domain[1] = d3.max(dat, get);
      } else {
        domain = def.domain;
      }
    }
    if (def.domainMin !== undefined) {
      if (vg.isObject(def.domainMin)) {
        dat = db[def.domainMin.data] || data;
        get = vg.accessor(def.domainMin.field);
        domain[0] = d3.min(dat, get);
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (vg.isObject(def.domainMax)) {
        dat = db[def.domainMax.data] || data;
        get = vg.accessor(def.domainMax.field);
        domain[1] = d3.max(dat, get);
      } else {
        domain[1] = def.domainMax;
      }
    }
    if (def.type !== LOG && (def.zero || def.zero===undefined)) {
      domain[0] = Math.min(0, domain[0]);
      domain[1] = Math.max(0, domain[1]);
    }
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    if (def.range=='height') rng = rng.reverse();
    scale[def.round ? "rangeRound" : "range"](rng);

    if (def.clamp) scale.clamp(true);
    if (def.nice) scale.nice();
    if (def.exponent && def.type===POWER) scale.exponent(def.exponent);
  }
  
  function range(def, group) {
    var rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (VARIABLE[def.range]) {
          rng = [0, group[def.range]];
        } else if (PREDEFINED[def.range]) {
          rng = vg[def.range];
        } else {
          vg.error("Unrecogized range: "+def.range);
          return rng;
        }
      } else if (Array.isArray(def.range)) {
        rng = def.range;
      } else {
        rng = [0, def.range];
      }
    }
    if (def.rangeMin !== undefined) {
      rng[0] = def.rangeMin;
    }
    if (def.rangeMax !== undefined) {
      rng[1] = def.rangeMax;
    }
    
    if (def.reverse !== undefined) {
      var rev = def.reverse;
      if (vg.isObject(rev)) {
        rev = vg.accessor(rev.field)(group.datum);
      }
      if (rev) rng = rng.reverse();
    }
    
    return rng;
  }
  
  return scales;
})();