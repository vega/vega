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
        i, len, item;

    // Items marked for removal are at the head of items. Process them first.
    for(i=0, len=input.rem.length; i<len; ++i) {
      item = input.rem[i];
      if(update) encode.call(this, update, item, input.trans);
      if(exit)   encode.call(this, exit,   item, input.trans); 
      if(input.trans && !exit) input.trans.interpolate(item, EMPTY);
      else if(!input.trans) item.remove();
    }

    for(i=0, len=input.add.length; i<len; ++i) {
      item = input.add[i];
      if(enter)  encode.call(this, enter,  item, input.trans);
      if(update) encode.call(this, update, item, input.trans);
      item.status = C.UPDATE;
    }

    if(update) {
      for(i=0, len=input.mod.length; i<len; ++i) {
        item = input.mod[i];
        encode.call(this, update, item, input.trans);
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

    enc.call(enc, item, item.mark.group||item, trans, db, sg, model.predicates());
  }

  return Encoder;
});
