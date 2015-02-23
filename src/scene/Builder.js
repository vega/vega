define(function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      Encoder  = require('./Encoder'),
      Bounder  = require('./Bounder'),
      Item  = require('./Item'),
      parseData = require('../parse/data'),
      tuple = require('../dataflow/tuple'),
      changeset = require('../dataflow/changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Builder() {    
    return arguments.length ? this.init.apply(this, arguments) : this;
  }

  var proto = (Builder.prototype = new Node());

  proto.init = function(model, def, mark, parent, parent_id, inheritFrom) {
    Node.prototype.init.call(this, model.graph)
      .router(true)
      .collector(true);

    this._model = model;
    this._def   = def;
    this._mark  = mark;
    this._from  = (def.from ? def.from.data : null) || inheritFrom;
    this._ds    = util.isString(this._from) ? model.data(this._from) : null;
    this._map   = {};
    this._items = [];

    mark.def = def;
    mark.marktype = def.type;
    mark.interactive = !(def.interactive === false);
    mark.items = this._items;

    this._parent = parent;
    this._parent_id = parent_id;

    if(def.from && (def.from.mark || def.from.transform || def.from.modify)) {
      inlineDs.call(this);
    }

    // Non-group mark builders are super nodes. Encoder and Bounder remain 
    // separate operators but are embedded and called by Builder.evaluate.
    this._isSuper = (this._def.type !== C.GROUP); 
    this._encoder = new Encoder(this._model, this._mark);
    this._bounder = new Bounder(this._model, this._mark);

    if(this._ds) { this._encoder.dependency(C.DATA, this._from); }

    // Since Builders are super nodes, copy over encoder dependencies
    // (bounder has no registered dependencies).
    this.dependency(C.DATA, this._encoder.dependency(C.DATA));
    this.dependency(C.SCALES, this._encoder.dependency(C.SCALES));
    this.dependency(C.SIGNALS, this._encoder.dependency(C.SIGNALS));

    return this;
  };

  proto.evaluate = function(input) {
    util.debug(input, ["building", this._from, this._def.type]);

    var fullUpdate = this._encoder.reevaluate(input),
        output, fcs, data;

    if(this._ds) {
      output = changeset.create(input);

      // If a scale or signal in the update propset has been updated, 
      // send forward all items for reencoding if we do an early return.
      if(fullUpdate) output.mod = this._items.slice();

      fcs = this._ds.last();
      if(!fcs) {
        output.reflow = true
      } else if(fcs.stamp > this._stamp) {
        output = joinChangeset.call(this, fcs);
      }
    } else {
      data = util.isFunction(this._def.from) ? this._def.from() : [C.SENTINEL];
      output = joinValues.call(this, input, data);
    }

    output = this._graph.evaluate(this._encoder, output);
    return this._isSuper ? this._graph.evaluate(this._bounder, output) : output;
  };

  // Reactive geometry and mark-level transformations are handled here 
  // because they need their group's data-joined context. 
  function inlineDs() {
    var from = this._def.from,
        name, spec, sibling, output;

    if(from.mark) {
      name = ["vg", this._parent_id, from.mark].join("_");
      spec = {
        name: name,
        transform: from.transform, 
        modify: from.modify
      };
    } else {
      name = ["vg", this._from, this._def.type, Date.now()].join("_");
      spec = {
        name: name,
        source: this._from,
        transform: from.transform,
        modify: from.modify
      };
    }

    this._from = name;
    this._ds = parseData.datasource(this._model, spec);

    if(from.mark) {
      sibling = this.sibling(from.mark);
      if(sibling._isSuper) sibling.addListener(this._ds.listener());
      else sibling._bounder.addListener(this._ds.listener());
    } else {
      // At this point, we have a new datasource but it is empty as
      // the propagation cycle has already crossed the datasources. 
      // So, we repulse just this datasource. This should be safe
      // as the ds isn't connected to the scenegraph yet.
      
      var output = this._ds.source().last();
          input  = changeset.create(output);

      input.add = output.add;
      input.mod = output.mod;
      input.rem = output.rem;
      input.stamp = null;
      this._ds.fire(input);
    }
  }

  proto.pipeline = function() {
    return [this];
  };

  proto.connect = function() {
    var builder = this;

    this._model.graph.connect(this.pipeline());
    this._encoder.dependency(C.SCALES).forEach(function(s) {
      builder._parent.scale(s).addListener(builder);
    });

    if(this._parent) {
      if(this._isSuper) this.addListener(this._parent._collector);
      else this._bounder.addListener(this._parent._collector);
    }

    return this;
  };

  proto.disconnect = function() {
    var builder = this;
    this._model.graph.disconnect(this.pipeline());
    this._encoder.dependency(C.SCALES).forEach(function(s) {
      builder._parent.scale(s).removeListener(builder);
    });
    return this;
  };

  proto.sibling = function(name) {
    return this._parent.child(name, this._parent_id);
  };

  function newItem(d, stamp) {
    var item   = tuple.ingest(new Item(this._mark));
    item.datum = d;

    // For the root node's item
    if(this._def.width)  tuple.set(item, "width",  this._def.width);
    if(this._def.height) tuple.set(item, "height", this._def.height);

    return item;
  };

  function joinChangeset(input) {
    var keyf = keyFunction(this._def.key || "_id"),
        output = changeset.create(input),
        add = input.add, 
        mod = input.mod, 
        rem = input.rem,
        stamp = input.stamp,
        i, key, len, item, datum;

    for(i=0, len=rem.length; i<len; ++i) {
      item = this._map[key = keyf(rem[i])];
      item.status = C.EXIT;
      output.rem.push(item);
      this._map[key] = null;
    }

    for(i=0, len=add.length; i<len; ++i) {
      key = keyf(datum = add[i]);
      item = newItem.call(this, datum, stamp);
      tuple.set(item, "key", key);
      item.status = C.ENTER;
      this._map[key] = item;
      this._items.push(item);
      output.add.push(item);
    }

    for(i=0, len=mod.length; i<len; ++i) {
      item = this._map[key = keyf(datum = mod[i])];
      tuple.set(item, "key", key);
      item.datum  = datum;
      item.status = C.UPDATE;
      output.mod.push(item);
    }

    // Sort items according to how data is sorted, or by _id. The else 
    // condition is important to ensure lines and areas are drawn correctly.
    this._items.sort(function(a, b) { 
      return input.sort ? input.sort(a.datum, b.datum) : (a.datum._id - b.datum._id);
    });

    return output;
  }

  function joinValues(input, data) {
    var keyf = keyFunction(this._def.key),
        prev = this._items.splice(0),
        output = changeset.create(input),
        i, key, len, item, datum, enter;

    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      item.status = C.EXIT;
      if (keyf) this._map[item.key] = item;
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      datum = data[i];
      key = i;
      item = keyf ? this._map[key = keyf(datum)] : prev[i];
      if(!item) {
        this._items.push(item = newItem.call(this, datum, input.stamp));
        output.add.push(item);
        tuple.set(item, "key", key);
        item.status = C.ENTER;
      } else {
        this._items.push(item);
        output.mod.push(item);
        tuple.set(item, "key", key);
        item.datum = datum;
        item.status = C.UPDATE;
      }
    }

    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      if (item.status === C.EXIT) {
        tuple.set(item, "key", keyf ? item.key : this._items.length);
        this._items.unshift(item);  // Keep item around for "exit" transition.
        output.rem.unshift(item);
      }
    }
    
    return output;
  };

  function keyFunction(key) {
    if (key == null) return null;
    var f = util.array(key).map(util.accessor);
    return function(d) {
      for (var s="", i=0, n=f.length; i<n; ++i) {
        if (i>0) s += "|";
        s += String(f[i](d));
      }
      return s;
    }
  };

  return Builder;
});