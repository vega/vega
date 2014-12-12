define(function(require, exports, module) {
  var encode  = require('./encode'),
      collect = require('../core/collector'),
      bounds  = require('./bounds'),
      group   = require('./group'),
      tuple = require('../core/tuple'),
      changeset = require('../core/changeset'),
      util = require('../util/index'),
      constants = require('../util/constants');

  // def is from the spec
  // mark is the scenegraph node to build out
  // parent is the dataflow builder node corresponding to the mark's group.
  return function build(model, renderer, def, mark, parent, inheritFrom) {
    var items = [], // Item nodes in the scene graph
        f = def.from || inheritFrom,
        from = util.isString(f) ? model.data(f) : null,
        lastBuild = 0,
        builder;

    function init() {
      mark.def = def;
      mark.marktype = def.type;
      mark.interactive = !(def.interactive === false);
      mark.items = items; 

      builder = new model.Node(buildItems);
      builder._type = 'builder';
      builder._router = true;
      builder._touchable = true;

      builder.def = def;
      builder.encoder = encode(model, mark);
      builder.collector = collect(model);
      builder.bounder = bounds(model, mark);
      builder.parent = parent;

      if(def.type === constants.GROUP){ 
        builder.group = group(model, def, mark, builder, renderer);
      }

      if(from) {
        builder._deps.data.push(f);
        builder.encoder._deps.data.push(f);
      }

      connect();
      builder.disconnect = disconnect;      

      return builder;
    };

    function pipeline() {
      var pipeline = [builder, builder.encoder];
      if(builder.group) pipeline.push(builder.group);
      pipeline.push(builder.collector, builder.bounder, renderer);
      return pipeline;
    };

    function connect() {
      model.graph.connect(pipeline());
      builder.encoder._deps.scales.forEach(function(s) {
        parent.group.scale(s).addListener(builder);
      });
      if(parent) builder.bounder.addListener(parent.collector);
    };

    function disconnect() {
      model.graph.disconnect(pipeline());
      builder.encoder._deps.scales.forEach(function(s) {
        parent.group.scale(s).removeListener(builder);
      });
      if(builder.group) builder.group.disconnect();
    };

    function newItem(d, stamp) {
      var item = tuple.create(null);
      tuple.set(item, "mark", mark);
      tuple.set(item, "datum", d);

      item.touch = function() {
        if (this.pathCache) this.pathCache = null;
        if (this.mark.pathCache) this.mark.pathCache = null;
      };

      // For the root node's item
      if(def.width)  tuple.set(item, "width",  def.width);
      if(def.height) tuple.set(item, "height", def.height);

      items.push(item); 
      return item;
    };

    function buildItems(input) {
      util.debug(input, ["building", f, def.type]);

      var output = changeset.create(input),
          fullUpdate = builder.encoder.reevaluate(input),
          fcs;

      // If a scale or signal in the update propset has been updated, 
      // send forward all items for reencoding.
      if(fullUpdate) output.mod = items.slice();

      if(from) {
        fcs = from._output;
        if(!fcs) return output.touch = true, output;
        if(fcs.stamp <= lastBuild) return output;

        var mod = util.tuple_ids(fcs.mod),
            rem = util.tuple_ids(fcs.rem),
            item, i, d;

        for(i = items.length-1; i >=0; i--) {
          item = items[i], d = item.datum;
          if(mod[d._id] === 1 && !fullUpdate) {
            output.mod.push(item);
          } else if(rem[d._id] === 1) {
            output.rem.push.apply(output.rem, items.splice(i, 1)[0]);
          }
        }

        output.add = fcs.add.map(function(d) { return newItem(d, fcs.stamp); });
        lastBuild = fcs.stamp;

        // Sort items according to how data is sorted, or by _id. The else 
        // condition is important to ensure lines and areas are drawn correctly.
        items.sort(function(a, b) { 
          return fcs.sort ? fcs.sort(a.datum, b.datum) : (a.datum._id - b.datum._id);
        });
      } else {
        if(util.isFunction(def.from)) {
          output.rem = items.splice(0);
          def.from().forEach(function(d) { output.add.push(newItem(d, input.stamp)); });
        } else {
          if(!items.length) output.add.push(newItem(constants.DEFAULT_DATA, input.stamp));
          else if(!fullUpdate) output.mod.push(items[0]);
        }
      }

      return output;
    };

    return init();
  }
})