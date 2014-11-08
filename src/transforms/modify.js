define(function(require, exports, module) {
  var util = require('../util/index'),
      tuple = require('../core/tuple');

  var ADD = "add", 
      REMOVE = "remove", 
      TOGGLE = "toggle", 
      CLEAR = "clear";

  var filter = function(field, value, src, dest) {
    for(var i = src.length-1; i >= 0; --i) {
      if(src[i][field] == value)
        dest.push.apply(dest, src.splice(i, 1));
    }
  };      

  return function parseModify(model, def) {
    var signal = def.signal ? util.field(def.signal) : null, 
        signalName = signal ? signal.shift() : null,
        predicate = def.predicate ? model.predicate(def.predicate) : null,
        reeval = (predicate === null);

    var node = new model.Node(function(input) {
      if(predicate !== null) {
        var db = {};
        (predicate.data||[]).forEach(function(d) { db[d] = model.data(d).data(); });

        // TODO: input
        reeval = predicate({}, db, model.signal(predicate.signals||[]), model._predicates);
      }

      global.debug(input, [def.type+"ing", reeval]);
      if(!reeval) return input;

      var datum = {}, value = null;
      if(signal) {
        value = model.signal(signalName).value();
        if(signal.length > 0) {
          var fn = Function("s", "return s["+signal.map(util.str).join("][")+"]");
          value = fn.call(null, value);
        }
      }

      datum[def.field] = value;

      if(def.type == ADD) {
        input.add.push(tuple.create(datum));
      } else if(def.type == REMOVE) {
        filter(def.field, value, input.add, input.rem);
        filter(def.field, value, input.mod, input.rem);
      } else if(def.type == TOGGLE) {
        var add = [], rem = [];
        filter(def.field, value, input.rem, add);
        filter(def.field, value, input.add, rem);
        filter(def.field, value, input.mod, rem);
        if(add.length == 0 && rem.length == 0) add.push(tuple.create(datum));
        input.add.push.apply(input.add, add);
        input.rem.push.apply(input.rem, rem);
      } else if(def.type == CLEAR) {
        console.log('clearing', util.duplicate(input));
        input.rem.push.apply(input.rem, input.add);
        input.rem.push.apply(input.rem, input.mod);
        input.add = [];
        input.mod = [];
        console.log('clearing', util.duplicate(input));
      } 

      input.fields[def.field] = 1;
      return input;
    });
    
    var deps = node._deps.signals;
    if(signalName) deps.push(signalName);
    if(predicate)  deps.push.apply(deps, predicate.signals);
    
    return node;
  }
});