define(function(require, exports, module) {
  var parseScale = require('../parse/scale'), 
      util = require('../util/index'),
      changeset = require('../core/changeset');

  var ORDINAL = "ordinal";

  return function scale(model, def) {
    var domain = def.domain||{}; // TODO: support all domain types

    function signals() {
      var signals = [];

      ['domain', 'range'].forEach(function(t) {
        if(util.isArray(def[t])) {
          def[t].forEach(function(v) { if(v.signal) signals.push(v.signal); });
        }
        if(def[t+'Min'] && def[t+'Min'].signal) signals.push(def[t+'Min'].signal);
        if(def[t+'Max'] && def[t+'Max'].signal) signals.push(def[t+'Max'].signal);
      });

      return signals.map(function(s) { return util.field(s)[0]; });
    }

    function reeval(group, input) {
      var from = model.data(domain.data || "vg_"+group.datum._id),
          fcs = from ? from._output : null,
          prev = group._prev || {},
          width = prev.width || {}, height = prev.height || {}, 
          reeval = fcs ? !!fcs.add.length || !!fcs.rem.length : false;

      if(domain.field) reeval = reeval || fcs.fields[domain.field];
      reeval = reeval || fcs ? !!fcs.sort && def.type === ORDINAL : false;
      reeval = reeval || node._deps.signals.some(function(s) { return !!input.signals[s]; });
      reeval = reeval || def.range == 'width'  && width.stamp  == input.stamp;
      reeval = reeval || def.range == 'height' && height.stamp == input.stamp;

      return reeval;
    }

    function scale(group) {
      global.debug({}, ["rescaling", group.datum._id]);

      var k = def.name, 
          scale = parseScale(model, def, group);

      group.scales[k+":prev"] = group.scales[k] || scale;
      group.scales[k] = scale;

      var deps = node._deps.data, 
          inherit = domain.data ? false : "vg_"+group.datum._id;

      if(inherit && deps.indexOf(inherit) === -1) deps.push(inherit);
    }

    var node = new model.Node(function(input) {
      global.debug(input, ["scaling", def.name]);

      input.add.forEach(scale);
      input.mod.forEach(function(group) {
        if(reeval(group, input)) scale(group);
      });

      // Scales are at the end of an encoding pipeline, so they should forward a
      // touch pulse. Thus, if multiple scales update in the parent group, we don't
      // reevaluate child marks multiple times. 
      var output = changeset.create(input, true);
      output.scales[def.name] = 1;
      return output;
    });

    if(domain.data) node._deps.data.push(domain.data);
    if(domain.field) node._deps.fields.push(domain.field);
    node._deps.signals = signals();

    return node;
  };
});