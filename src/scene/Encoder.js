define(function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      util = require('../util/index'),
      C = require('../util/constants'),
      EMPTY = {};

  function Encoder(model, mark) {
    var props = mark.def.properties || {},
        update = props.update;

    Node.prototype.init.call(this, model.graph)

    this._model = model;
    this._mark  = mark;

    if(update) {
      this.dependency(C.DATA, update.data);
      this.dependency(C.SCALES, update.scales);
      this.dependency(C.SIGNALS, update.signals);
    }

    return this;
  }

  var proto = (Encoder.prototype = new Node());

  proto.evaluate = function(input) {
    util.debug(input, ["encoding", this._mark.def.type]);
    var items = this._mark.items,
        props = this._mark.def.properties || {},
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, item;

    // Only do one traversal of items and use item.status instead
    // of input.add/mod/rem.
    for(i=0; i<items.length; ++i) {
      item = items[i];

      // enter set
      if(item.status === C.ENTER) {
        if(enter) encode.call(this, enter, item, input.trans, input.stamp);
        item.status = C.UPDATE;
      }

      // update set      
      if (item.status !== C.EXIT && update) {
        encode.call(this, update, item, input.trans, input.stamp);
      }
      
      // exit set
      if (item.status === C.EXIT) {
        if (exit) encode.call(this, exit, item, input.trans, input.stamp); 
        if (input.trans && !exit) input.trans.interpolate(item, EMPTY);
        else if (!input.trans) items[i--].remove();
      }
    }

    return input;
  };

  function encode(prop, item, trans, stamp) {
    var model = this._model,
        enc = prop.encode,
        sg = this._graph.signalValues(prop.signals||[]),
        db = (prop.data||[]).reduce(function(db, ds) { 
          return db[ds] = model.data(ds).values(), db;
        }, {});

    enc.call(enc, stamp, item, item.mark.group||item, trans, db, sg, model.predicates());
  }

  return Encoder;
});
