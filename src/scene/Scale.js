define(function(require, exports, module) {
  var d3 = require('d3'),
      Node = require('../dataflow/Node'),
      Stats = require('../transforms/Stats'),
      changeset = require('../dataflow/changeset'),
      util = require('../util/index'),
      config = require('../util/config'),
      C = require('../util/constants');

  var GROUP_PROPERTY = {width: 1, height: 1};

  function Scale(model, def, parent) {
    this._model = model;
    this._def = def;
    this._parent = parent;
    return Node.prototype.init.call(this, model.graph);
  }

  var proto = (Scale.prototype = new Node());

  proto.evaluate = function(input) {
    var self = this,
        fn = function(group) { scale.call(self, group); };

    input.add.forEach(fn);
    input.mod.forEach(fn);

    // Scales are at the end of an encoding pipeline, so they should forward a
    // reflow pulse. Thus, if multiple scales update in the parent group, we don't
    // reevaluate child marks multiple times. 
    return changeset.create(input, true);
  };

  // All of a scale's dependencies are registered during propagation as we parse
  // dataRefs. So a scale must be responsible for connecting itself to dependents.
  proto.dependency = function(type, deps) {
    if(arguments.length == 2) {
      deps = util.array(deps);
      for(var i=0, len=deps.length; i<len; ++i) {
        this._graph[type == C.DATA ? C.DATA : C.SIGNAL](deps[i])
          .addListener(this._parent);
      }
    }

    return Node.prototype.dependency.call(this, type, deps);
  };

  function scale(group) {
    var name = this._def.name,
        prev = name + ":prev",
        s = instance.call(this, group.scale(name)),
        m = s.type===C.ORDINAL ? ordinal : quantitative,
        rng = range.call(this, group);

    m.call(this, s, rng, group);

    group.scale(name, s);
    group.scale(prev, group.scale(prev) || s);

    return s;
  }

  function instance(scale) {
    var type = this._def.type || C.LINEAR;
    if (!scale || type !== scale.type) {
      var ctor = config.scale[type] || d3.scale[type];
      if (!ctor) util.error("Unrecognized scale type: " + type);
      (scale = ctor()).type = scale.type || type;
      scale.scaleName = this._def.name;
    }
    return scale;
  }

  function ordinal(scale, rng, group) {
    var def = this._def,
        domain, sort, str, refs, dataDrivenRange = false;
    
    // range pre-processing for data-driven ranges
    if (util.isObject(def.range) && !util.isArray(def.range)) {
      dataDrivenRange = true;
      rng = dataRef.call(this, C.RANGE, def.range, scale, group);
    }
    
    // domain
    domain = dataRef.call(this, C.DOMAIN, def.domain, scale, group);
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

  function quantitative(scale, rng, group) {
    var def = this._def,
        domain, interval;

    // domain
    domain = (def.type === C.QUANTILE)
      ? dataRef.call(this, C.DOMAIN, def.domain, scale, group)
      : domainMinMax.call(this, scale, group);
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    if (def.range === "height") rng = rng.reverse();
    scale[def.round && scale.rangeRound ? "rangeRound" : "range"](rng);

    if (def.exponent && def.type===C.POWER) scale.exponent(def.exponent);
    if (def.clamp) scale.clamp(true);
    if (def.nice) {
      if (def.type === C.TIME) {
        interval = d3.time[def.nice];
        if (!interval) util.error("Unrecognized interval: " + interval);
        scale.nice(interval);
      } else {
        scale.nice();
      }
    }
  }

  function dataRef(which, def, scale, group) {
    if(util.isArray(def)) return def.map(signal.bind(this));

    var self = this, graph = this._graph,
        refs = def.fields || util.array(def),
        uniques = scale.type === C.ORDINAL || scale.type === C.QUANTILE,
        ck = "_"+which,
        cache = scale[ck],
        sort = def.sort,
        i, rlen, j, flen, r, fields, meas, from, data, keys;

    if(!cache) {
      cache = scale[ck] = new Stats(graph), meas = [];
      if(uniques && sort) meas.push(sort.stat);
      else if(!uniques) meas.push(C.MIN, C.MAX);
      cache.measures.set(cache, meas);
    }

    for(i=0, rlen=refs.length; i<rlen; ++i) {
      r = refs[i];
      from = r.data || "vg_"+group.datum._id;
      data = graph.data(from)
        .revises(true)
        .last();

      if(data.stamp <= this._stamp) continue;

      fields = util.array(r.field).map(function(f) {
        if(f.group) return util.accessor(f.group)(group.datum)
        return f; // String or {"signal"}
      });

      if(uniques) {
        cache.on.set(cache, sort ? sort.field : "_id");
        for(j=0, flen=fields.length; j<flen; ++j) {
          cache.group_by.set(cache, fields[j])
            .evaluate(data);
        }
      } else {
        for(j=0, flen=fields.length; j<flen; ++j) {
          cache.on.set(cache, fields[j])  // Treat as flat datasource
            .evaluate(data);
        }
      }

      this.dependency(C.DATA, from);
      cache.dependency(C.SIGNALS).forEach(function(s) { self.dependency(C.SIGNALS, s) });
    }

    data = cache.data();
    if(uniques) {
      keys = util.keys(data)
        .filter(function(k) { return data[k] != null; })
        .map(function(k) { return { key: k, tpl: data[k].tpl }});

      if(sort) {
        sort = sort.order.signal ? graph.signalRef(sort.order.signal) : sort.order;
        sort = (sort == C.DESC ? "-" : "+") + "tpl." + cache.on.get(graph).field;
        sort = util.comparator(sort);
      } else {  // "First seen" order
        sort = util.comparator("tpl._id");
      }

      return keys.sort(sort).map(function(k) { return k.key });
    } else {
      data = data[""]; // Unpack flat aggregation
      return data == null ? [] : [data.tpl.min, data.tpl.max];
    }
  }

  function signal(v) {
    var s = v.signal, ref;
    if(!s) return v;
    this.dependency(C.SIGNALS, (ref = util.field(s))[0]);
    return this._graph.signalRef(ref);
  }

  function domainMinMax(scale, group) {
    var def = this._def,
        domain = [null, null], refs, z;

    if (def.domain !== undefined) {
      domain = (!util.isObject(def.domain)) ? domain :
        dataRef.call(this, C.DOMAIN, def.domain, scale, group);
    }

    z = domain.length - 1;
    if (def.domainMin !== undefined) {
      if (util.isObject(def.domainMin)) {
        if(def.domainMin.signal) {
          domain[0] = signal.call(this, def.domainMin);
        } else {
          domain[0] = dataRef.call(this, C.DOMAIN+C.MIN, def.domainMin, scale, group)[0];
        }
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (util.isObject(def.domainMax)) {
        if(def.domainMax.signal) {
          domain[z] = signal.call(this, def.domainMax);
        } else {
          domain[z] = dataRef.call(this, C.DOMAIN+C.MAX, def.domainMax, scale, group)[1];
        }
      } else {
        domain[z] = def.domainMax;
      }
    }
    if (def.type !== C.LOG && def.type !== C.TIME && (def.zero || def.zero===undefined)) {
      domain[0] = Math.min(0, domain[0]);
      domain[z] = Math.max(0, domain[z]);
    }
    return domain;
  }

  function range(group) {
    var def = this._def,
        rng = [null, null];

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
        rng = def.range.map(signal.bind(this));
      } else if (util.isObject(def.range)) {
        return null; // early exit
      } else {
        rng = [0, def.range];
      }
    }
    if (def.rangeMin !== undefined) {
      rng[0] = def.rangeMin.signal ? signal.call(this, def.rangeMin) : def.rangeMin;
    }
    if (def.rangeMax !== undefined) {
      rng[rng.length-1] = def.rangeMax.signal ? signal.call(this, def.rangeMax) : def.rangeMax;
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

  return Scale;
});