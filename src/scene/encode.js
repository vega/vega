define(function(require, exports, module) {
  var util = require('../util/index'),
      C = require('../util/constants'),
      EMPTY = {};
  
  return function encode(model, mark) {
    var props = mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      i, len, item, prop;

    function encodeProp(prop, item, trans, stamp) {
      var sg = model.signalValues(prop.signals||[]),
          db = {};

      (prop.data||[]).forEach(function(d) { db[d] = model.data(d).values(); });

      prop.encode.call(prop.encode, stamp, item, item.mark.group||item, trans, 
        db, sg, model._predicates);
    }

    var node = new model.Node(function(input) {
      util.debug(input, ["encoding", mark.def.type]);
      var items = mark.items,
          i, item;

      // Only do one traversal of items and use item.status instead
      // of input.add/mod/rem.
      for(i=0; i<items.length; ++i) {
        item = items[i];

        // enter set
        if(item.status === C.ENTER) {
          if(enter) encodeProp(enter, item, input.trans, input.stamp);
          item.status = C.UPDATE;
        }

        // update set      
        if (item.status !== C.EXIT && update) {
          encodeProp(update, item, input.trans, input.stamp);
        }
        
        // exit set
        if (item.status === C.EXIT) {
          if (exit) encodeProp(exit, item, input.trans, input.stamp); 
          if (input.trans && !exit) input.trans.interpolate(item, EMPTY);
          else if (!input.trans) items[i--].remove();
        }
      }

      return input;
    });

    var deps = node._deps;
    if(update) {
      deps.signals = update.signals;
      deps.scales  = update.scales;
      deps.data    = update.data;
    }

    return node;
  }; 
});

