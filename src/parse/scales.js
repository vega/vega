vg.parse.scales = (function() {
  var LINEAR = "linear",
      ORDINAL = "ordinal",
      KEYWORD = {width: 1, height: 1};

  function scales(spec, scales, db) {
    return (spec || []).reduce(function(o, def) {
      o[def.name] = scale(def, o[def.name], db);
      return o;
    }, scales || {});
  }

  function scale(def, scale, db) {
    var type = def.type || LINEAR,
        s = scale || d3.scale[type](),
        rng = range(def, s);
    (type===ORDINAL ? ordinal : quantitative)(def, s, rng, db);
    return s;
  }
  
  function ordinal(def, scale, rng, db) {
    var domain, data, get, str;
    
    // domain
    domain = def.domain;
    if (Array.isArray(domain)) {
      scale.domain(domain);
    } else if (vg.isObject(domain)) {
      data = db[domain.data];
      get = vg.accessor(domain.field);      
      scale.domain(vg.unique(data, get));
    }

    // range
    str = typeof range[0] === 'string';
    if (def.reverse) rng = rng.reverse();
    if (str) {
      scale.range(rng); // color or shape values
    } else if (def.round || def.round===undefined) {
      scale.rangeRoundBands(rng, def.padding||0);
    } else {
      scale.rangeBands(rng, def.padding||0);
    }
  }
  
  function quantitative(def, scale, rng, db) {
    var domain, data, get;
    
    // domain
    domain = [null, null];
    if (def.domain !== undefined) {
      if (Array.isArray(def.domain)) {
        domain = def.domain.slice();
      } else if (vg.isObject(def.domain)) {
        data = db[def.domain.data];
        get = vg.accessor(def.domain.field);
        domain[0] = d3.min(data, get);
        domain[1] = d3.max(data, get);
      } else {
        domain = def.domain;
      }
    }
    if (def.domainMin !== undefined) {
      if (vg.isObject(def.domainMin)) {
        data = db[def.domainMin.data];
        get = vg.accessor(def.domainMin.field);
        domain[0] = d3.min(data, get);
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (vg.isObject(def.domainMax)) {
        data = db[def.domainMax.data];
        get = vg.accessor(def.domainMax.field);
        domain[1] = d3.max(data, get);
      } else {
        domain[1] = def.domainMax;
      }
    }
    if (def.zero || def.zero===undefined) {
      domain[0] = Math.min(0, domain[0]);
      domain[1] = Math.max(0, domain[1]);
    }
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    rng = (!!def.reverse) != (def.range=='height') ? rng.reverse() : rng;
    scale[def.round ? "rangeRound" : "range"](rng);

    if (def.clamp) scale.clamp(true);
    if (def.nice) scale.nice();
    if (def.exponent && def.type==="pow") scale.exponent(def.exponent);
  }
  
  function range(def) {
    var rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (KEYWORD[def.range]) {
          rng = [0, def.range]
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
    return rng;
  }
  
  return scales;
})();