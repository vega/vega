var dl = require('datalib'),
    Collector = require('vega-dataflow').Collector,
    log = require('vega-logging'),
    Transform = require('./Transform');

function Zip(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    with: {type: 'data'},
    as:  {type: 'value'},
    key: {type: 'field', default: 'data'},
    withKey: {type: 'field', default: null},
    default: {type: 'value'}
  });

  this._map = {};
  this._collector = new Collector(graph);
  this._lastJoin = 0;

  return this.revises(true).mutates(true);
}

var prototype = (Zip.prototype = Object.create(Transform.prototype));
prototype.constructor = Zip;

function mp(k) {
  return this._map[k] || (this._map[k] = []);
}

prototype.transform = function(input) {
  log.debug(input, ['zipping']);

  var w = this.param('with'),
      wds = w.source,
      woutput = wds.last(),
      wdata = wds.values(),
      key = this.param('key'),
      withKey = this.param('withKey'),
      as = this.param('as'),
      dflt = this.param('default'),
      map = mp.bind(this),
      rem = {};

  if (withKey.field) {
    if (woutput && woutput.stamp > this._lastJoin) {
      woutput.rem.forEach(function(x) {
        var m = map(withKey.accessor(x));
        if (m[0]) m[0].forEach(function(d) { d[as] = dflt; });
        m[1] = null;
      });

      woutput.add.forEach(function(x) { 
        var m = map(withKey.accessor(x));
        if (m[0]) m[0].forEach(function(d) { d[as] = x; });
        m[1] = x;
      });
      
      // Only process woutput.mod tuples if the join key has changed.
      // Other field updates will auto-propagate via prototype.
      if (woutput.fields[withKey.field]) {
        woutput.mod.forEach(function(x) {
          var prev;
          if (!x._prev || (prev = withKey.accessor(x._prev)) === undefined) return;
          var prevm = map(prev);
          if (prevm[0]) prevm[0].forEach(function(d) { d[as] = dflt; });
          prevm[1] = null;

          var m = map(withKey.accessor(x));
          if (m[0]) m[0].forEach(function(d) { d[as] = x; });
          m[1] = x;
        });
      }

      this._lastJoin = woutput.stamp;
    }
  
    input.add.forEach(function(x) {
      var m = map(key.accessor(x));
      x[as] = m[1] || dflt;
      (m[0]=m[0]||[]).push(x);
    });

    input.rem.forEach(function(x) { 
      var k = key.accessor(x);
      (rem[k]=rem[k]||{})[x._id] = 1;
    });

    if (input.fields[key.field]) {
      input.mod.forEach(function(x) {
        var prev;
        if (!x._prev || (prev = key.accessor(x._prev)) === undefined) return;

        var m = map(key.accessor(x));
        x[as] = m[1] || dflt;
        (m[0]=m[0]||[]).push(x);
        (rem[prev]=rem[prev]||{})[x._id] = 1;
      });
    }

    dl.keys(rem).forEach(function(k) { 
      var m = map(k);
      if (!m[0]) return;
      m[0] = m[0].filter(function(x) { return rem[k][x._id] !== 1; });
    });
  } else {
    // We only need to run a non-key-join again if we've got any add/rem
    // on input or woutput
    if (!(input.add.length || input.rem.length ||
          woutput.add.length || woutput.rem.length)) {
      return input;
    }

    // If we don't have a key-join, then we need to materialize both
    // data sources to iterate through them. 
    this._collector.evaluate(input);

    var data = this._collector.data(), 
        wlen = wdata.length, i;

    for (i=0; i<data.length; i++) {
      data[i][as] = wdata[i%wlen];
    }
  }

  input.fields[as] = 1;
  return input;
};

module.exports = Zip;

Zip.baseSchema = {
  "type": {"enum": ["zip"]},
  "with": {
    "type": "string",
    "description": "The name of the secondary data set to \"zip\" with the current, primary data set."
  },
  "as": {
    "type": "string",
    "description": "The name of the field in which to store the secondary data set values."
  }
};

Zip.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Zip transform",
  "description": "Merges two data sets together.",
  "type": "object",
  "oneOf": [
    { 
      "properties": Zip.baseSchema,
      "required": ["type", "with", "as"],
      "additionalProperties": false
    },
    {
      "properties": dl.extend({
        "key": {
          "description": "The field in the primary data set to match against the secondary data set.",
          "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
        },
        "withKey": {
          "description": "The field in the secondary data set to match against the primary data set.",
          "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
        },
        "default": {
          // "type": "any",
          "description": "A default value to use if no matching key value is found."
        }
      }, Zip.baseSchema),
      "required": ["type", "with", "as", "key", "withKey"],
      "additionalProperties": false
    }
  ]
};