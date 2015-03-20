var runner = require('./runner');

function d3_add() {
  var runner = this,
      sb = 0, 
      tb;

  this.benchmark = function(s0, results) {
    var data = runner.data,
        N = data.length * 0.01,
        newData = [];

    if(sb == 0) {
      while(newData.length < N) {
        newData.push(data[Math.floor(Math.random() * data.length)]);
      }

      tb = Date.now();
      runner.update(runner.data.concat(newData));
      sb = 1;
      return s0;
    } else if(sb == 1) {
      results.push({ type: "d3 add", time: Date.now() - tb });
      sb = 2;
      return ++s0;
    }
  };
}

function d3_mod() {
  var runner = this,
      sb = 0, 
      tb;

  function isNumber(obj) { 
    return Object.prototype.toString.call(obj) == '[object Number]'; 
  }

  this.benchmark = function(s0, results) {
    var data = runner.data,
        N = data.length * 0.01,
        newData = [],
        bind = {}, ids = {}, 
        id, d, prop;

    if(sb == 0) {
      Object.keys(data[0]).some(function(p) {
        return isNumber(data[0][p]) && p != 'idx' ? (prop = p) : false;
      });

      while(Object.keys(ids).length < N) {
        id = Math.floor(Math.random() * data.length);
        d = data[id], ids[id] = 1;
        d[prop] = 2*d[prop] + d[prop];
      }

      tb = Date.now();
      runner.update(data);
      sb = 1;
      return s0;      
    } else if(sb == 1) {
      results.push({ type: "d3 mod", time: Date.now() - tb });
      sb = 2;
      return ++s0;
    }
  };
}

function d3_rem() {
  var runner = this,
      sb = 0, 
      tb;

  this.benchmark = function(s0, results) {
    var data = runner.data,
        len = data.length,
        N = data.length * 0.01;

    if(sb == 0) {
      while(data.length > (len - N)) {
        data.splice(Math.floor(Math.random() * data.length), 1);
      }

      tb = Date.now();
      runner.update(data);
      sb = 1;
      return s0;
    } else if(sb == 1) {
      results.push({ type: "d3 rem", time: Date.now() - tb });
      sb = 2;
      return ++s0;
    }
  };
}

function vg1_add() {
  this.benchmark = function(view, results) {
    var def = view._model.defs().data.defs[0],
        data = def.values,
        N = data.length * 0.01,
        newData = [],
        bind = {}, t;

    while(newData.length < N) {
      newData.push(data[Math.floor(Math.random() * data.length)]);
    }

    bind[def.name] = data.concat(newData);
    t = Date.now();
    view.data(bind).update();
    results.push({ type: 'vg1 add', time: Date.now() - t});
  };
}

function vg1_mod() {
  this.benchmark = function(view, results) {
    var def = view._model.defs().data.defs[0],
        data  = def.values,
        N = data.length * 0.01,
        newData = [],
        bind = {}, ids = {}, 
        id, d, prop, t;

    Object.keys(data[0]).some(function(p) {
      return vg.isNumber(data[0][p]) && p != 'idx' ? (prop = p) : false;
    });

    while(Object.keys(ids).length < N) {
      id = Math.floor(Math.random() * data.length);
      d = data[id], ids[id] = 1;
      d[prop] = 2*d[prop] + d[prop];
    }

    bind[def.name] = data;
    t = Date.now();
    view.data(bind).update();
    results.push({type: 'vg1 mod', time: Date.now() - t});
  };
}

function vg1_rem() {
  this.benchmark = function(view, results) {
    var def = view._model.defs().data.defs[0],
        data = def.values,
        len = data.length,
        N = data.length * 0.01,
        bind = {}, t;

    while(data.length > (len - N)) {
      data.splice(Math.floor(Math.random() * data.length), 1);
    }

    bind[def.name] = data;
    t = Date.now();
    view.data(bind).update();
    results.push({type: 'vg1 rem', time: Date.now() - t});
  };
}

function vg2_add() {
  this.benchmark = function(view, results) {
    var model = view.model(),
        def = model.defs().data[0],
        data  = def.values,
        N = data.length * 0.01,
        newData = [],
        t;

    while(newData.length < N) {
      newData.push(data[Math.floor(Math.random() * data.length)]);
    }

    // vg.config.debug = true
    model.data(def.name).add(newData);
    t = Date.now();
    model.data(def.name).fire();
    results.push({type: 'vg2 add', time: Date.now() - t});
  };
}

function vg2_mod() {
  this.benchmark = function(view, results) {
    var model = view.model(),
        def = model.defs().data[0],
        data  = def.values,
        N = data.length * 0.01,
        where = function(d) { return d._id in ids },
        func = function(d) { return d[prop] = 2*d[prop] + d[prop]; },
        ids = {}, 
        prop, id, t;

    Object.keys(data[0]).some(function(p) {
      return vg.util.isNumber(data[0][p]) && p != 'idx' ? (prop = p) : false;
    });

    while(Object.keys(ids).length < N) {
      ids[data[Math.floor(Math.random() * data.length)]._id] = 1;
    }

    model.data(def.name).update(where, prop, func);
    t = Date.now();
    model.data(def.name).fire();
    results.push({type: 'vg2 mod', time: Date.now() - t});
  };
}

function vg2_rem() {
  this.benchmark = function(view, results) {
    var model = view.model(),
        def = model.defs().data[0],
        data  = def.values,
        N = data.length * 0.01,
        where = function(d) { return d._id in ids },
        ids = {}, t;

    while(Object.keys(ids).length < N) {
      ids[data[Math.floor(Math.random() * data.length)]._id] = 1;
    }

    // vg.config.debug = true
    model.data(def.name).remove(where);
    t = Date.now();
    model.data(def.name).fire();
    results.push({type: 'vg2 rem', time: Date.now() - t});
  };
}

var benchmark = process.argv[2],
    spec = process.argv[3],
    N = process.argv[4] || 1000,
    C = process.argv[5] || 50,
    results = [spec, N, C].join('.');

switch(benchmark) {
  case 'd3.add':  runner('d3',  spec, N, C, results, d3_add);  break;
  case 'd3.mod':  runner('d3',  spec, N, C, results, d3_mod);  break;
  case 'd3.rem':  runner('d3',  spec, N, C, results, d3_rem);  break;
  case 'vg1.add': runner('vg1', spec, N, C, results, vg1_add); break;
  case 'vg1.mod': runner('vg1', spec, N, C, results, vg1_mod); break;
  case 'vg1.rem': runner('vg1', spec, N, C, results, vg1_rem); break;
  case 'vg2.add': runner('vg2', spec, N, C, results, vg2_add); break;
  case 'vg2.mod': runner('vg2', spec, N, C, results, vg2_mod); break;
  case 'vg2.rem': runner('vg2', spec, N, C, results, vg2_rem); break;
}
