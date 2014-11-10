define(function(require, exports, module) {
  // Run compatibility layer to override vg1 functions.
  require('./compat')();  

  var DEBUG = false;
  global.debug = function(input, args) {
    if(!DEBUG) return;
    var log = Function.prototype.bind.call(console.log, console);
    args.unshift(input.stamp||-1);
    if(input.add) args.push(input.add.length, input.mod.length, input.rem.length, !!input.touch);
    log.apply(console, args);
  }

  return function(model, name, spec, suite, cb) {
    suite.tasks.unshift({ node: model, label: "Initial run" })
    return function(task, i) {
      var node = task.node, t0, dt;

      if(task.data) {
        node = model.data(task.data);
        if(task.action === "add") node.add(task.values);
        else if(task.action === "remove") node.remove(task.where);
        else if(task.action === "update") node.update(task.where, task.field, task.value);
      } else if(task.signal) {
        node = model.signal(task.signal)
          .value(task.value);
      }

      t0 = Date.now();
      node.fire();
      dt = Date.now() - t0;

      cb(i, task, dt, model._data[name]);
    };
  }
});