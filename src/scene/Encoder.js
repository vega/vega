var util = require('datalib/src/util'),
    bound = require('vega-scenegraph/src/util/bound'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging');
  
var EMPTY = {};

function Encoder(graph, mark) {
  var props  = mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit;

  Node.prototype.init.call(this, graph);

  this._mark = mark;
  var s = this._scales = [];

  // Only scales used in the "update" property set are set as
  // encoder depedencies to have targeted reevaluations. However,
  // we still want scales in "enter" and "exit" to be evaluated
  // before the encoder. 
  if (enter) s.push.apply(s, enter.scales);

  if (update) {
    this.dependency(Deps.DATA, update.data);
    this.dependency(Deps.SIGNALS, update.signals);
    this.dependency(Deps.FIELDS, update.fields);
    this.dependency(Deps.SCALES, update.scales);
    s.push.apply(s, update.scales);
  }

  if (exit) s.push.apply(s, exit.scales);

  return this;
}

var proto = (Encoder.prototype = new Node());

proto.evaluate = function(input) {
  log.debug(input, ["encoding", this._mark.def.type]);
  var graph = this._graph,
      props = this._mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      dirty  = input.dirty,
      preds  = this._graph.predicates(),
      sg = graph.signalValues(),  // For expediency, get all signal values
      db = graph.dataValues(), 
      req = input.request,
      i, len, item, prop;

  if (req) {
    if ((prop = props[req])) {
      for (i=0, len=input.mod.length; i<len; ++i) {
        item = input.mod[i];
        encode.call(this, prop, item, input.trans, db, sg, preds, dirty);
      }
    }

    return input; // exit early if given request
  }

  // Items marked for removal are at the head of items. Process them first.
  for (i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if (exit)   encode.call(this, exit,   item, input.trans, db, sg, preds, dirty); 
    if (input.trans && !exit) input.trans.interpolate(item, EMPTY);
    else if (!input.trans) item.remove();
  }

  for (i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if (enter)  encode.call(this, enter,  item, input.trans, db, sg, preds, dirty);
    if (update) encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    item.status = require('./Builder').STATUS.UPDATE;
  }

  if (update) {
    for (i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    }
  }

  return input;
};

function encode(prop, item, trans, db, sg, preds, dirty) {
  var enc = prop.encode,
      wasDirty = item._dirty,
      isDirty  = enc.call(enc, item, item.mark.group||item, trans, db, sg, preds);

  item._dirty = isDirty || wasDirty;
  if (isDirty && !wasDirty) dirty.push(item);
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
Encoder.update = function(graph, trans, request, items, dirty) {
  items = util.array(items);
  var preds = graph.predicates(), 
      db = graph.dataValues(),
      sg = graph.signalValues(),
      i, len, item, props, prop;

  for (i=0, len=items.length; i<len; ++i) {
    item = items[i];
    props = item.mark.def.properties;
    prop = props && props[request];
    if (prop) {
      encode.call(null, prop, item, trans, db, sg, preds, dirty);
      bound.item(item);
    }
  }

};

module.exports = Encoder;