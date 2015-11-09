var dl = require('datalib'),
    log = require('vega-logging'),
    df = require('vega-dataflow'),
    Node = df.Node, // jshint ignore:line
    Deps = df.Dependencies,
    bound = require('vega-scenegraph').bound;

var EMPTY = {};

function Encoder(graph, mark, builder) {
  var props  = mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit;

  Node.prototype.init.call(this, graph);

  this._mark = mark;
  this._builder = builder;
  var s = this._scales = [];

  // Only scales used in the 'update' property set are set as
  // encoder depedencies to have targeted reevaluations. However,
  // we still want scales in 'enter' and 'exit' to be evaluated
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

  return this.mutates(true);
}

var proto = (Encoder.prototype = new Node());

proto.evaluate = function(input) {
  log.debug(input, ['encoding', this._mark.def.type]);
  var graph = this._graph,
      props = this._mark.def.properties || {},
      items = this._mark.items,
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      dirty  = input.dirty,
      preds  = graph.predicates(),
      req = input.request,
      group = this._mark.group,
      guide = group && (group.mark.axis || group.mark.legend),
      db = EMPTY, sg = EMPTY, i, len, item, prop;

  if (req && !guide) {
    if ((prop = props[req]) && input.mod.length) {
      db = prop.data ? graph.values(Deps.DATA, prop.data) : null;
      sg = prop.signals ? graph.values(Deps.SIGNALS, prop.signals) : null;

      for (i=0, len=input.mod.length; i<len; ++i) {
        item = input.mod[i];
        encode.call(this, prop, item, input.trans, db, sg, preds, dirty);
      }
    }

    return input; // exit early if given request
  }

  db = values(Deps.DATA, graph, input, props);
  sg = values(Deps.SIGNALS, graph, input, props);

  // Items marked for removal are at the tail of items. Process them first.
  for (i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if (exit) encode.call(this, exit, item, input.trans, db, sg, preds, dirty);
    if (input.trans && !exit) input.trans.interpolate(item, EMPTY);
    else if (!input.trans) items.pop();
  }

  var update_status = require('./Builder').STATUS.UPDATE;
  for (i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if (enter)  encode.call(this, enter,  item, input.trans, db, sg, preds, dirty);
    if (update) encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    item.status = update_status;
  }

  if (update) {
    for (i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    }
  }

  return input;
};

// Only marshal necessary data and signal values
function values(type, graph, input, props) {
  var p, x, o, add = input.add.length;
  if ((p=props.enter) && (x=p[type]).length && add) {
    o = graph.values(type, x, (o=o||{}));
  }
  if ((p=props.exit) && (x=p[type]).length && input.rem.length) {
    o = graph.values(type, x, (o=o||{}));
  }
  if ((p=props.update) && (x=p[type]).length && (add || input.mod.length)) {
    o = graph.values(type, x, (o=o||{}));
  }
  return o || EMPTY;
}

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
  var def = this._mark.def,
      props = def.properties || {},
      reeval = dl.isFunction(def.from) || def.orient || pulse.request ||
        Node.prototype.reevaluate.call(this, pulse);

  return reeval || (props.update ? nestedRefs.call(this) : false);
};

// Test if any nested refs trigger a reflow of mark items.
function nestedRefs() {
  var refs = this._mark.def.properties.update.nested,
      parent = this._builder,
      level = 0,
      i = 0, len = refs.length,
      ref, ds, stamp;

  for (; i<len; ++i) {
    ref = refs[i];

    // Scale references are resolved via this._mark._scaleRefs which are
    // added to dependency lists + connected in Builder.evaluate.
    if (ref.scale) continue;

    for (; level<ref.level; ++level) {
      parent = parent.parent();
      ds = parent.ds();
    }

    // Compare stamps to determine if a change in a group's properties
    // or data should trigger a reeval. We cannot check anything fancier
    // (e.g., pulse.fields) as the ref may use item.datum.
    stamp = (ref.group ? parent.encoder() : ds.last())._stamp;
    if (stamp > this._stamp) return true;
  }

  return false;
}

// Short-circuit encoder if user specifies items
Encoder.update = function(graph, trans, request, items, dirty) {
  items = dl.array(items);
  var preds = graph.predicates(),
      db = graph.values(Deps.DATA),
      sg = graph.values(Deps.SIGNALS),
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
