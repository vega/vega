var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    bounds = require('../util/bounds'),
    C = require('../util/constants'),
    debug = require('../util/debug'),
    EMPTY = {};

function Encoder(graph, mark) {
  var props = mark.def.properties || {},
      update = props.update;

  Node.prototype.init.call(this, graph)

  this._mark  = mark;

  if(update) {
    this.dependency(C.DATA, update.data);
    this.dependency(C.SCALES, update.scales);
    this.dependency(C.SIGNALS, update.signals);
    this.dependency(C.FIELDS, update.fields);
  }

  return this;
}

var proto = (Encoder.prototype = new Node());

proto.evaluate = function(input) {
  debug(input, ["encoding", this._mark.def.type]);
  var graph = this._graph,
      items = this._mark.items,
      props = this._mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      preds  = this._graph.predicates(),
      sg = graph.signalValues(),  // For expediency, get all signal values
      db = graph.dataValues(), 
      req = input.request,
      i, len, item, prop;

  if(req) {
    if(prop = props[req]) {
      for(i=0, len=input.mod.length; i<len; ++i) {
        item = input.mod[i];
        encode.call(this, prop, item, input.trans, db, sg, preds);
      }
    }

    return input; // exit early if given request
  }

  // Items marked for removal are at the head of items. Process them first.
  for(i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if(update) encode.call(this, update, item, input.trans, db, sg, preds);
    if(exit)   encode.call(this, exit,   item, input.trans, db, sg, preds); 
    if(input.trans && !exit) input.trans.interpolate(item, EMPTY);
    else if(!input.trans) item.remove();
  }

  for(i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if(enter)  encode.call(this, enter,  item, input.trans, db, sg, preds);
    if(update) encode.call(this, update, item, input.trans, db, sg, preds);
    item.status = C.UPDATE;
  }

  if(update) {
    for(i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans, db, sg, preds);
    }
  }

  return input;
};

function encode(prop, item, trans, db, sg, preds) {
  var enc = prop.encode;
  enc.call(enc, item, item.mark.group||item, trans, db, sg, preds);
}

// If a specified property set called, or update property set 
// uses nested fieldrefs, reevaluate all items.
proto.reevaluate = function(pulse) {
  var props = this._mark.def.properties || {},
      update = props.update;

  return pulse.request || 
    Node.prototype.reevaluate.call(this, pulse) || 
    (update ? update.reflow : false);
};

// Short-circuit encoder if user specifies items
Encoder.update = function(graph, trans, request, items) {
  items = dl.array(items);
  var preds = graph.predicates(), 
      db = graph.dataValues(),
      sg = graph.signalValues(),
      i, len, item, props, prop;

  for (i=0, len=items.length; i<len; ++i) {
    item = items[i];
    props = item.mark.def.properties;
    prop = props && props[request];
    if (prop) {
      encode.call(null, prop, item, trans, db, sg, preds);
      bounds.item(item);
    }
  }

};

module.exports = Encoder;