vg.parse.scales = (function() {
  var LINEAR = "linear",
      ORDINAL = "ordinal",
      LOG = "log",
      POWER = "pow",
      TIME = "time",
      VARIABLE = {width: 1, height: 1},
      CONSTANT = {category10: 1, category20: 1, shapes: 1};

  var SCALES = {
    "time": d3.time.scale,
    "utc":  d3.time.scale.utc
  };

  function scales(spec, scales, db, group) {
    return (spec || []).reduce(function(o, def) {
      o[def.name] = scale(def, o[def.name], db, group);
      return o;
    }, scales || {});
  }

  function scale(def, scale, db, group) {
    var type = def.type || LINEAR,
        rng = range(def, group),
        s = instance(type, scale),
        m = type===ORDINAL ? ordinal : quantitative,
        data = vg.values(group.datum);
    
    m(def, s, rng, db, data);
    return s;
  }
  
  function instance(type, scale) {
    if (!scale || type !== scale.type) {
      var ctor = SCALES[type] || d3.scale[type];
      if (!ctor) vg.error("Unrecognized scale type: " + type);
      (scale = ctor()).type = type;
    }
    return scale;
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
    var domain, dat, interval;

    // domain
    domain = [null, null];
    if (def.domain !== undefined) {
      if (vg.isArray(def.domain)) {
        domain = def.domain.slice();
      } else if (vg.isObject(def.domain)) {
        dat = db[def.domain.data] || data;
        vg.array(def.domain.field).forEach(function(f,i) {
          f = vg.accessor(f);
          domain[0] = d3.min([domain[0], d3.min(dat, f)]);
          domain[1] = d3.max([domain[1], d3.max(dat, f)]);
        });
      } else {
        domain = def.domain;
      }
    }
    if (def.domainMin !== undefined) {
      if (vg.isObject(def.domainMin)) {
        domain[0] = null;
        dat = db[def.domainMin.data] || data;
        vg.array(def.domainMin.field).forEach(function(f,i) {
          f = vg.accessor(f);
          domain[0] = d3.min([domain[0], d3.min(dat, f)]);
        });
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (vg.isObject(def.domainMax)) {
        domain[1] = null;
        dat = db[def.domainMax.data] || data;
        vg.array(def.domainMax.field).forEach(function(f,i) {
          f = vg.accessor(f);
          domain[1] = d3.max([domain[1], d3.max(dat, f)]);
        });
      } else {
        domain[1] = def.domainMax;
      }
    }
    if (def.type !== LOG && def.type !== TIME && (def.zero || def.zero===undefined)) {
      domain[0] = Math.min(0, domain[0]);
      domain[1] = Math.max(0, domain[1]);
    }
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    if (def.range=='height') rng = rng.reverse();
    scale[def.round ? "rangeRound" : "range"](rng);

    if (def.exponent && def.type===POWER) scale.exponent(def.exponent);
    if (def.clamp) scale.clamp(true);
    if (def.nice) {
      if (def.type === TIME) {
        interval = d3.time[def.nice];
        if (!interval) vg.error("Unrecognized interval: " + interval);
        scale.nice(interval);
      } else {
        scale.nice();
      }
    }
  }
  
  function range(def, group) {
    var rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (VARIABLE[def.range]) {
          rng = [0, group[def.range]];
        } else if (CONSTANT[def.range]) {
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