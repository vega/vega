var df = require('vega-dataflow'),
    Tuple = df.Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform');

function CountPattern(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field:     {type: 'field', default: 'data'},
    pattern:   {type: 'value', default: '[\\w\']+'},
    case:      {type: 'value', default: 'lower'},
    stopwords: {type: 'value', default: ''}
  });

  this._output = {text: 'text', count: 'count'};

  return this.router(true).produces(true);
}

var prototype = (CountPattern.prototype = Object.create(Transform.prototype));
prototype.constructor = CountPattern;

prototype.transform = function(input, reset) {
  log.debug(input, ['countpattern']);

  var get = this.param('field').accessor,
      pattern = this.param('pattern'),
      stop = this.param('stopwords'),
      rem = false;

  // update parameters
  if (this._stop !== stop) {
    this._stop = stop;
    this._stop_re = new RegExp('^' + stop + '$', 'i');
    reset = true;
  }

  if (this._pattern !== pattern) {
    this._pattern = pattern;
    this._match = new RegExp(this._pattern, 'g');
    reset = true;
  }

  if (reset) this._counts = {};

  function curr(t) { return (Tuple.prev_init(t), get(t)); }
  function prev(t) { return get(Tuple.prev(t)); }

  this._add(input.add, curr);
  if (!reset) this._rem(input.rem, prev);
  if (reset || (rem = input.fields[get.field])) {
    if (rem) this._rem(input.mod, prev);
    this._add(input.mod, curr);
  }

  // generate output tuples
  return this._changeset(input);
};

prototype._changeset = function(input) {
  var counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      change = df.ChangeSet.create(input),
      out = this._output, w, t, c;

  for (w in counts) {
    t = tuples[w];
    c = counts[w] || 0;
    if (!t && c) {
      tuples[w] = (t = Tuple.ingest({}));
      t[out.text] = w;
      t[out.count] = c;
      change.add.push(t);
    } else if (c === 0) {
      if (t) change.rem.push(t);
      delete counts[w];
      delete tuples[w];
    } else if (t[out.count] !== c) {
      Tuple.set(t, out.count, c);
      change.mod.push(t);
    }
  }
  return change;
};

prototype._tokenize = function(text) {
  switch (this.param('case')) {
    case 'upper': text = text.toUpperCase(); break;
    case 'lower': text = text.toLowerCase(); break;
  }
  return text.match(this._match);
};

prototype._add = function(tuples, get) {
  var counts = this._counts,
      stop = this._stop_re,
      tok, i, j, t;

  for (j=0; j<tuples.length; ++j) {
    tok = this._tokenize(get(tuples[j]));
    for (i=0; i<tok.length; ++i) {
      if (!stop.test(t=tok[i])) {
        counts[t] = 1 + (counts[t] || 0);
      }
    }
  }
};

prototype._rem = function(tuples, get) {
  var counts = this._counts,
      stop = this._stop_re,
      tok, i, j, t;

  for (j=0; j<tuples.length; ++j) {
    tok = this._tokenize(get(tuples[j]));
    for (i=0; i<tok.length; ++i) {
      if (!stop.test(t=tok[i])) {
        counts[t] -= 1;
      }
    }
  }
};

module.exports = CountPattern;

CountPattern.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "CountPattern transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["countpattern"]},
    "field": {
      "description": "The field containing the text to analyze.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": 'data'
    },
    "pattern": {
      "description": "A regexp pattern for matching words in text.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "[\\w\']+"
    },
    "case": {
      "description": "Text case transformation to apply.",
      "oneOf": [{"enum": ["lower", "upper", "none"]}, {"$ref": "#/refs/signal"}],
      "default": "lower"
    },
    "stopwords": {
      "description": "A regexp pattern for matching stopwords to omit.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": ""
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "text": {"type": "string", "default": "text"},
        "count": {"type": "string", "default": "count"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};
