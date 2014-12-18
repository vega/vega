define(function(require, module, exports) {
  var d3 = require('d3'),
      config = require('../util/config'),
      util = require('../util/index'),
      C = require('../util/constants');

  var LINEAR = C.LINEAR,
      ORDINAL = C.ORDINAL,
      LOG = C.LOG,
      POWER = C.POWER,
      TIME = C.TIME,
      QUANTILE = C.QUANTILE,
      GROUP_PROPERTY = {width: 1, height: 1};

  function scale(model, def, group) {
    var s = instance(def),
        m = s.type===ORDINAL ? ordinal : quantitative,
        rng = range(model, def, group),
        data = util.values(group.datum);

    m(model, def, s, rng, data);
    return s;
  }

  function instance(def) {
    var type = def.type || LINEAR, 
        scale;
    if (!scale || type !== scale.type) {
      var ctor = config.scale[type] || d3.scale[type];
      if (!ctor) util.error("Unrecognized scale type: " + type);
      (scale = ctor()).type = scale.type || type;
      scale.scaleName = def.name;
    }
    return scale;
  }

  function ordinal(model, def, scale, rng, data) {
    var domain, sort, str, refs, dataDrivenRange = false;
    
    // range pre-processing for data-driven ranges
    if (util.isObject(def.range) && !util.isArray(def.range)) {
      dataDrivenRange = true;
      refs = def.range.fields || util.array(def.range);
      rng = extract(model, refs, data);
    }
    
    // domain
    sort = def.sort && !dataDrivenRange;
    domain = domainValues(model, def, data, sort);
    if (domain) scale.domain(domain);

    // range
    str = typeof rng[0] === 'string';
    if (str || rng.length > 2 || rng.length===1 || dataDrivenRange) {
      scale.range(rng); // color or shape values
    } else if (def.points) {
      scale.rangePoints(rng, def.padding||0);
    } else if (def.round || def.round===undefined) {
      scale.rangeRoundBands(rng, def.padding||0);
    } else {
      scale.rangeBands(rng, def.padding||0);
    }
  }

  function quantitative(model, def, scale, rng, data) {
    var domain, interval;

    // domain
    domain = (def.type === QUANTILE)
      ? domainValues(model, def, data, false)
      : domainMinMax(model, def, data);
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    if (def.range === "height") rng = rng.reverse();
    scale[def.round && scale.rangeRound ? "rangeRound" : "range"](rng);

    if (def.exponent && def.type===POWER) scale.exponent(def.exponent);
    if (def.clamp) scale.clamp(true);
    if (def.nice) {
      if (def.type === TIME) {
        interval = d3.time[def.nice];
        if (!interval) util.error("Unrecognized interval: " + interval);
        scale.nice(interval);
      } else {
        scale.nice();
      }
    }
  }
  
  function extract(model, refs, data) {
    return refs.reduce(function(values, r) {        
      var dat = util.values(model.data(r.data) || data),
          get = util.accessor(util.isString(r.field)
              ? r.field : "data." + util.accessor(r.field.group)(data));
      return util.unique(dat, get, values);
    }, []);
  }

  function signal(model, v) {
    if(!v.signal) return v;
    return model.signalRef(v.signal);
  }
  
  function domainValues(model, def, data, sort) {
    var domain = def.domain, values, refs;
    if (util.isArray(domain)) {
      values = sort ? domain.slice() : domain;
      values = values.map(signal.bind(null, model));
    } else if (util.isObject(domain)) {
      refs = domain.fields || util.array(domain);
      values = extract(model, refs, data);
    }
    if (values && sort) values.sort(util.cmp);
    return values;
  }
  
  function domainMinMax(model, def, data) {
    var domain = [null, null], refs, z;
    
    function extract(ref, min, max, z) {
      var dat = util.values(model.data(ref.data) || data);
      var fields = util.array(ref.field).map(function(f) {
        return util.isString(f) ? f
          : "data." + util.accessor(f.group)(data);
      });
      
      fields.forEach(function(f,i) {
        f = util.accessor(f);
        if (min) domain[0] = d3.min([domain[0], d3.min(dat, f)]);
        if (max) domain[z] = d3.max([domain[z], d3.max(dat, f)]);
      });
    }

    if (def.domain !== undefined) {
      if (util.isArray(def.domain)) {
        domain = def.domain.slice().map(signal.bind(null, model));
      } else if (util.isObject(def.domain)) {
        refs = def.domain.fields || util.array(def.domain);
        refs.forEach(function(r) { extract(r,1,1,1); });
      } else {
        domain = def.domain;
      }
    }
    z = domain.length - 1;
    if (def.domainMin !== undefined) {
      if (util.isObject(def.domainMin)) {
        if(def.domainMin.signal) {
          domain[0] = signal(model, def.domainMin);
        } else {
          domain[0] = null;
          refs = def.domainMin.fields || util.array(def.domainMin);
          refs.forEach(function(r) { extract(r,1,0,z); });
        }
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (util.isObject(def.domainMax)) {
        if(def.domainMax.signal) {
          domain[z] = signal(model, def.domainMax);
        } else {
          domain[z] = null;
          refs = def.domainMax.fields || util.array(def.domainMax);
          refs.forEach(function(r) { extract(r,0,1,z); });
        }
      } else {
        domain[z] = def.domainMax;
      }
    }
    if (def.type !== LOG && def.type !== TIME && (def.zero || def.zero===undefined)) {
      domain[0] = Math.min(0, domain[0]);
      domain[z] = Math.max(0, domain[z]);
    }
    return domain;
  }

  function range(model, def, group) {
    var rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (GROUP_PROPERTY[def.range]) {
          rng = [0, group[def.range]];
        } else if (config.range[def.range]) {
          rng = config.range[def.range];
        } else {
          util.error("Unrecogized range: "+def.range);
          return rng;
        }
      } else if (util.isArray(def.range)) {
        rng = def.range.map(signal.bind(null, model));
      } else if (util.isObject(def.range)) {
        return null; // early exit
      } else {
        rng = [0, def.range];
      }
    }
    if (def.rangeMin !== undefined) {
      rng[0] = def.rangeMin.signal ? signal(model, def.rangeMin) : def.rangeMin;
    }
    if (def.rangeMax !== undefined) {
      rng[rng.length-1] = def.rangeMax.signal ? signal(model, def.rangeMax) : def.rangeMax;
    }
    
    if (def.reverse !== undefined) {
      var rev = def.reverse;
      if (util.isObject(rev)) {
        rev = util.accessor(rev.field)(group.datum);
      }
      if (rev) rng = rng.reverse();
    }
    
    return rng;
  }

  return scale;
});
