var dl = require('datalib'),
    log = require('vega-logging'),
    Item = require('vega-scenegraph').Item,
    df = require('vega-dataflow'),
    Node = df.Node, // jshint ignore:line
    Deps = df.Dependencies,
    Tuple = df.Tuple,
    ChangeSet = df.ChangeSet,
    Sentinel = {},
    Encoder  = require('./Encoder'),
    Bounder  = require('./Bounder'),
    parseData = require('../parse/data');

function Builder() {
  return arguments.length ? this.init.apply(this, arguments) : this;
}

var Status = Builder.STATUS = {
  ENTER:  'enter',
  UPDATE: 'update',
  EXIT:   'exit'
};

var CONNECTED = 1, DISCONNECTED = 2;

var proto = (Builder.prototype = new Node());

proto.init = function(graph, def, mark, parent, parent_id, inheritFrom) {
  Node.prototype.init.call(this, graph)
    .router(true)
    .collector(true);

  this._def   = def;
  this._mark  = mark;
  this._from  = (def.from ? def.from.data : null) || inheritFrom;
  this._ds    = dl.isString(this._from) ? graph.data(this._from) : null;
  this._map   = {};
  this._status = null; // Connected or disconnected?

  mark.def = def;
  mark.marktype = def.type;
  mark.interactive = (def.interactive !== false);
  mark.items = [];
  if (dl.isValid(def.name)) mark.name = def.name;

  this._parent = parent;
  this._parent_id = parent_id;

  if (def.from && (def.from.mark || def.from.transform || def.from.modify)) {
    inlineDs.call(this);
  }

  // Non-group mark builders are super nodes. Encoder and Bounder remain
  // separate operators but are embedded and called by Builder.evaluate.
  this._isSuper = (this._def.type !== 'group');
  this._encoder = new Encoder(this._graph, this._mark, this);
  this._bounder = new Bounder(this._graph, this._mark);
  this._output  = null; // Output changeset for reactive geom as Bounder reflows

  if (this._ds) { this._encoder.dependency(Deps.DATA, this._from); }

  // Since Builders are super nodes, copy over encoder dependencies
  // (bounder has no registered dependencies).
  this.dependency(Deps.DATA, this._encoder.dependency(Deps.DATA));
  this.dependency(Deps.SCALES, this._encoder.dependency(Deps.SCALES));
  this.dependency(Deps.SIGNALS, this._encoder.dependency(Deps.SIGNALS));

  return this;
};

// Reactive geometry and mark-level transformations are handled here
// because they need their group's data-joined context.
function inlineDs() {
  var from = this._def.from,
      geom = from.mark,
      src, name, spec, sibling, output, input, node;

  if (geom) {
    sibling = this.sibling(geom);
    src  = sibling._isSuper ? sibling : sibling._bounder;
    name = ['vg', this._parent_id, geom, src.listeners(true).length].join('_');
    spec = {
      name: name,
      transform: from.transform,
      modify: from.modify
    };
  } else {
    src = this._graph.data(this._from);
    if (!src) throw Error('Data source "'+this._from+'" is not defined.');
    name = ['vg', this._from, this._def.type, src.listeners(true).length].join('_');
    spec = {
      name: name,
      source: this._from,
      transform: from.transform,
      modify: from.modify
    };
  }

  this._from = name;
  this._ds = parseData.datasource(this._graph, spec);

  if (geom) {
    // Bounder reflows, so we need an intermediary node to propagate
    // the output constructed by the Builder.
    node = new Node(this._graph).addListener(this._ds.listener());
    node.evaluate = function(input) {
      var out  = ChangeSet.create(input),
          sout = sibling._output;

      out.add = sout.add;
      out.mod = sout.mod;
      out.rem = sout.rem;
      return out;
    };
    src.addListener(node);
  } else {
    // At this point, we have a new datasource but it is empty as
    // the propagation cycle has already crossed the datasources.
    // So, we repulse just this datasource. This should be safe
    // as the ds isn't connected to the scenegraph yet.
    output = this._ds.source().last();
    input  = ChangeSet.create(output);

    input.add = output.add;
    input.mod = output.mod;
    input.rem = output.rem;
    input.stamp = null;
    this._graph.propagate(input, this._ds.listener(), output.stamp);
  }
}

proto.ds = function() { return this._ds; };
proto.parent   = function() { return this._parent; };
proto.encoder  = function() { return this._encoder; };
proto.pipeline = function() { return [this]; };

proto.connect = function() {
  var builder = this;

  this._graph.connect(this.pipeline());
  this._encoder._scales.forEach(function(s) {
    if (!(s = builder._parent.scale(s))) return;
    s.addListener(builder);
  });

  if (this._parent) {
    if (this._isSuper) this.addListener(this._parent._collector);
    else this._bounder.addListener(this._parent._collector);
  }

  return (this._status = CONNECTED, this);
};

proto.disconnect = function() {
  var builder = this;
  if (!this._listeners.length) return this;

  function disconnectScales(scales) {
    for(var i=0, len=scales.length, s; i<len; ++i) {
      if (!(s = builder._parent.scale(scales[i]))) continue;
      s.removeListener(builder);
    }
  }

  Node.prototype.disconnect.call(this);
  this._graph.disconnect(this.pipeline());
  disconnectScales(this._encoder._scales);
  disconnectScales(dl.keys(this._mark._scaleRefs));

  return (this._status = DISCONNECTED, this);
};

proto.sibling = function(name) {
  return this._parent.child(name, this._parent_id);
};

proto.evaluate = function(input) {
  log.debug(input, ['building', (this._from || this._def.from), this._def.type]);

  var self = this,
      def = this._mark.def,
      props  = def.properties || {},
      update = props.update   || {},
      output = ChangeSet.create(input),
      fullUpdate, fcs, data, name;

  if (this._ds) {
    // We need to determine if any encoder dependencies have been updated.
    // However, the encoder's data source will likely be updated, and shouldn't
    // trigger all items to mod.
    data = output.data[(name=this._ds.name())];
    output.data[name] = null;
    fullUpdate = this._encoder.reevaluate(output);
    output.data[name] = data;

    fcs = this._ds.last();
    if (!fcs) throw Error('Builder evaluated before backing DataSource.');
    if (fcs.stamp > this._stamp) {
      join.call(this, fcs, output, this._ds.values(), true, fullUpdate);
    } else if (fullUpdate) {
      output.mod = this._mark.items.slice();
    }
  } else {
    data = dl.isFunction(this._def.from) ? this._def.from() : [Sentinel];
    join.call(this, input, output, data);
  }

  // Stash output before Bounder for downstream reactive geometry.
  this._output = output = this._graph.evaluate(output, this._encoder);

  // Add any new scale references to the dependency list, and ensure
  // they're connected.
  if (update.nested && update.nested.length && this._status === CONNECTED) {
    dl.keys(this._mark._scaleRefs).forEach(function(s) {
      var scale = self._parent.scale(s);
      if (!scale) return;

      scale.addListener(self);
      self.dependency(Deps.SCALES, s);
      self._encoder.dependency(Deps.SCALES, s);
    });
  }

  // Supernodes calculate bounds too, but only on items marked dirty.
  if (this._isSuper) {
    output.mod = output.mod.filter(function(x) { return x._dirty; });
    output = this._graph.evaluate(output, this._bounder);
  }

  return output;
};

function newItem() {
  var item = Tuple.ingest(new Item(this._mark));

  // For the root node's item
  if (this._def.width)  Tuple.set(item, 'width',  this._def.width);
  if (this._def.height) Tuple.set(item, 'height', this._def.height);
  return item;
}

function join(input, output, data, ds, fullUpdate) {
  var keyf = keyFunction(this._def.key || (ds ? '_id' : null)),
      prev = this._mark.items || [],
      rem  = ds ? input.rem : prev,
      mod  = Tuple.idMap((!ds || fullUpdate) ? data : input.mod),
      next = [],
      i, key, len, item, datum, enter, diff;

  // Only mark rems as exiting. Due to keyf, there may be an add/mod
  // tuple that replaces it.
  for (i=0, len=rem.length; i<len; ++i) {
    item = (rem[i] === prev[i]) ? prev[i] :
      keyf ? this._map[keyf(rem[i])] : rem[i];
    item.status = Status.EXIT;
  }

  for(i=0, len=data.length; i<len; ++i) {
    datum = data[i];
    item  = keyf ? this._map[key = keyf(datum)] : prev[i];
    enter = item ? false : (item = newItem.call(this), true);
    item.status = enter ? Status.ENTER : Status.UPDATE;
    diff = !enter && item.datum !== datum;
    item.datum = datum;

    if (keyf) {
      Tuple.set(item, 'key', key);
      this._map[key] = item;
    }

    if (enter) {
      output.add.push(item);
    } else if (diff || mod[datum._id]) {
      output.mod.push(item);
    }

    next.push(item);
  }

  for (i=0, len=rem.length; i<len; ++i) {
    item = (rem[i] === prev[i]) ? prev[i] :
      keyf ? this._map[key = keyf(rem[i])] : rem[i];
    if (item.status === Status.EXIT) {
      item._dirty = true;
      input.dirty.push(item);
      next.push(item);
      output.rem.push(item);
      if (keyf) this._map[key] = null;
    }
  }

  return (this._mark.items = next, output);
}

function keyFunction(key) {
  if (key == null) return null;
  var f = dl.array(key).map(dl.accessor);
  return function(d) {
    for (var s='', i=0, n=f.length; i<n; ++i) {
      if (i>0) s += '|';
      s += String(f[i](d));
    }
    return s;
  };
}

module.exports = Builder;
