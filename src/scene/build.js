define(function(require, exports, module) {
  var encode  = require('./encode'),
      collect = require('../core/collector'),
      bounds  = require('./bounds'),
      group   = require('./group'),
      Item  = require('./Item'),
      tuple = require('../core/tuple'),
      changeset = require('../core/changeset'),
      util = require('../util/index'),
      C = require('../util/constants');


  // def is from the spec
  // mark is the scenegraph node to build out
  // parent is the dataflow builder node corresponding to the mark's group.
  return function build(model, renderer, def, mark, parent, inheritFrom) {
    var items = [], // Item nodes in the scene graph
        f = def.from || inheritFrom,
        from = util.isString(f) ? model.data(f) : null,
        lastBuild = 0,
        builder, encoder, bounder;

    function init() {
      mark.def = def;
      mark.marktype = def.type;
      mark.interactive = !(def.interactive === false);
      mark.items = items; 

      builder = new model.Node(buildItems);
      builder._type = 'builder';
      builder._router = true;
      builder._touchable = true;

      encoder = encode(model, mark);
      bounder = bounds(model, mark);
      builder.collector = collect(model);

      if(def.type === C.GROUP){ 
        builder.group = group(model, def, mark, builder, parent, renderer);
      }

      if(from) {
        builder._deps.data.push(f);
        encoder._deps.data.push(f);
      }

      connect();
      builder.disconnect = disconnect;      

      return builder;
    };

    function pipeline() {
      var pipeline = [builder, encoder];
      if(builder.group) pipeline.push(builder.group);
      pipeline.push(builder.collector, bounder, renderer);
      return pipeline;
    };

    function connect() {
      model.graph.connect(pipeline());
      encoder._deps.scales.forEach(function(s) {
        parent.group.scale(s).addListener(builder);
      });
      if(parent) bounder.addListener(parent.collector);
    };

    function disconnect() {
      model.graph.disconnect(pipeline());
      encoder._deps.scales.forEach(function(s) {
        parent.group.scale(s).removeListener(builder);
      });
      if(builder.group) builder.group.disconnect();
    };

    function newItem(d, stamp) {
      var item = tuple.create(new Item(mark));
      tuple.set(item, "datum", d);

      // For the root node's item
      if(def.width)  tuple.set(item, "width",  def.width);
      if(def.height) tuple.set(item, "height", def.height);

      return item;
    };

    function buildItems(input) {
      util.debug(input, ["building", f, def.type]);

      var output = changeset.create(input),
          fullUpdate = encoder.reevaluate(input),
          fcs, data;

      if(from) {
        // If a scale or signal in the update propset has been updated, 
        // send forward all items for reencoding if we do an early return.
        if(fullUpdate) output.mod = items.slice();

        fcs = from._output;
        if(!fcs) return output.touch = true, output;
        if(fcs.stamp <= lastBuild) return output;

        data = from.values();
        lastBuild = fcs.stamp;
      } else {
        data = util.isFunction(def.from) ? def.from() : [C.SENTINEL];
      }

      return join(input, data);
    };

    function join(input, data) {
      var keyf = keyFunction(def.key),
          prev = items.splice(0),
          map  = {},
          output = changeset.create(input),
          i, key, len, item, datum, enter;

      for (i=0, len=prev.length; i<len; ++i) {
        item = prev[i];
        item.status = C.EXIT;
        if (keyf) map[item.key] = item;
      }
      
      for (i=0, len=data.length; i<len; ++i) {
        datum = data[i];
        key = i;
        item = keyf ? map[key = keyf(datum)] : prev[i];
        if(!item) {
          items.push(item = newItem(datum, input.stamp));
          output.add.push(item);
          tuple.set(item, "key", key);
          item.status = C.ENTER;
        } else {
          items.push(item);
          output.mod.push(item);
          tuple.set(item, "key", key);
          item.datum = datum;
          item.status = C.UPDATE;
        }
      }

      for (i=0, len=prev.length; i<len; ++i) {
        item = prev[i];
        if (item.status === C.EXIT) {
          tuple.set(item, "key", keyf ? item.key : items.length);
          items.unshift(item);  // Keep item around for "exit" transition.
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

    return init();
  }
})