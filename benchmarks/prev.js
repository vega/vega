var runner = require('./runner');

function alwaysPrev() {
  var runner = this,
      data = this.spec.data[0].values,
      Datasource = vg.dataflow.Datasource.prototype,
      revises = Datasource.revises,
      add = Datasource.add,
      Builder = vg.scene.Builder.prototype,
      bi = Builder.init;

  this.data = data;
  delete this.spec.data[0].values;

  this.viewFactory = function alwaysPrev(model) {
    Datasource.revises = function() { return (this._revises = true, this); };
    Datasource.add = function() { return (this._revises = true, add.apply(this, arguments)); }
    Builder.init = function() { bi.apply(this, arguments); this._revises = true; return this; };

    model.data('A').add(vg.util.duplicate(data));
    model.data('B').add(vg.util.duplicate(data));
    return vg.core.View.factory(model);
  };
}

function neverPrev() {
  var runner = this,
      data = this.spec.data[0].values,
      Datasource = vg.dataflow.Datasource.prototype,
      revises = Datasource.revises,
      add = Datasource.add,
      Builder = vg.scene.Builder.prototype,
      bi = Builder.init;

  this.data = data;
  delete this.spec.data[0].values;

  this.viewFactory = function neverPrev(model) {
    Datasource.revises = function() { return (this._revises = false, this); };
    Datasource.add = function() { return (this._revises = false, add.apply(this, arguments)); }
    Builder.init = function() { bi.apply(this, arguments); this._revises = false; return this; };

    model.data('A').add(vg.util.duplicate(data));
    model.data('B').add(vg.util.duplicate(data));
    return vg.core.View.factory(model);
  } 
}

function sometimesPrev() {
  var runner = this,
      data = this.spec.data[0].values,
      Datasource = vg.dataflow.Datasource.prototype,
      revises = Datasource.revises,
      add = Datasource.add,
      Builder = vg.scene.Builder.prototype,
      bi = Builder.init;

  this.data = data;
  delete this.spec.data[0].values;

  this.viewFactory = function sometimesPrev(model) {
    model.data('A').add(vg.util.duplicate(data));
    model.data('B').add(vg.util.duplicate(data));
    return vg.core.View.factory(model);
  } 
}

function modifyTuples() {
  var runner = this;

  this.benchmark = function(view, results) {
    var name  = this.viewFactory.name,
        model = view.model(),
        data  = this.data,
        mod   = data.length * 0.01,
        field = 'y',
        func  = function(d) { return d.y*2 },
        ids   = {}, id, where,
        next;

    results[results.length-1].type = name+' '+results[results.length-1].type;
    results[results.length-2].type = name+' '+results[results.length-2].type;
    results.push({type: name+' vg2 rendered heap', size: window.performance.memory.usedJSHeapSize});

    while(Object.keys(ids).length < mod) {
      id = data[Math.floor(Math.random() * data.length)].idx;
      ids[id] = 1;
    }

    where = function(d) { return d.idx in ids };
    next = Date.now();
    model.data('A').update(where, field, func);
    model.data('B').update(where, field, func);
    model.fire();
    results.push({type: name+' modify 1% time', time: Date.now() - next});
    results.push({type: name+' modify 1% heap', size: window.performance.memory.usedJSHeapSize});

    where = function(d) { return d.idx > -1 };
    next = Date.now();
    model.data('A').update(where, field, func);
    model.data('B').update(where, field, func);
    model.fire();
    results.push({type: name+' modify all time', time: Date.now() - next});
    results.push({type: name+' modify all heap', size: window.performance.memory.usedJSHeapSize});


    // ids = {};
    // mod = 10;
    // while(Object.keys(ids).length < mod) {
    //   id = data[Math.floor(Math.random() * data.length)].idx;
    //   ids[id] = 1;
    // }

    // next = Date.now();
    // where = function(d) { return d.idx in ids };
    // model.data('A').update(where, field, func);
    // model.data('B').update(where, field, func);
    // model.fire();
    // results.push({type: name+' modify 10 time', time: Date.now() - next});
    // results.push({type: name+' modify 10 heap', size: window.performance.memory.usedJSHeapSize});
  };
}

var benchmark = process.argv[2],
    N = process.argv[3] || 1000,
    C = process.argv[4] || 50,
    spec = 'prev',
    results = [spec, N, C].join('.');

switch(benchmark) {
  case 'alwaysPrev':     runner('vg2', spec, N, C, results, modifyTuples, alwaysPrev);    break;
  case 'neverPrev':      runner('vg2', spec, N, C, results, modifyTuples, neverPrev);     break;
  case 'sometimesPrev':  runner('vg2', spec, N, C, results, modifyTuples, sometimesPrev); break;
}