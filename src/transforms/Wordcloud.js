var dl = require('datalib'),
    d3 = require('d3'),
    d3_cloud = require('d3-cloud'),
    canvas = require('vega-scenegraph').canvas,
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Wordcloud(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    size: {type: 'array<value>', default: require('./screen').size},
    text: {type: 'field', default: 'data'},
    rotate: {type: 'field|value', default: 0},
    font: {type: 'field|value', default: {value: 'sans-serif'}},
    fontSize: {type: 'field|value', default: 14},
    fontStyle: {type: 'field|value', default: {value: 'normal'}},
    fontWeight: {type: 'field|value', default: {value: 'normal'}},
    fontScale: {type: 'array<value>', default: [10, 50]},
    padding: {type: 'value', default: 1},
    spiral: {type: 'value', default: 'archimedean'}
  });

  this._layout = d3_cloud().canvas(canvas.instance);

  this._output = {
    'x':          'layout_x',
    'y':          'layout_y',
    'font':       'layout_font',
    'fontSize':   'layout_fontSize',
    'fontStyle':  'layout_fontStyle',
    'fontWeight': 'layout_fontWeight',
    'rotate':     'layout_rotate',
  };

  return this.mutates(true);
}

var prototype = (Wordcloud.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Wordcloud;

function get(p) {
  return (p && p.accessor) || p;
}

function wrap(tuple) {
  var x = Object.create(tuple);
  x._tuple = tuple;
  return x;
}

prototype.batchTransform = function(input, data) {
  log.debug(input, ['wordcloud']);

  // get variables
  var layout = this._layout,
      output = this._output,
      fontSize = this.param('fontSize'),
      range = fontSize.accessor && this.param('fontScale'),
      size, scale;
  fontSize = fontSize.accessor || d3.functor(fontSize);

  // create font size scaling function as needed
  if (range.length) {
    scale = d3.scale.sqrt()
      .domain(dl.extent(data, size=fontSize))
      .range(range);
    fontSize = function(x) { return scale(size(x)); };
  }

  // configure layout
  layout
    .size(this.param('size'))
    .text(get(this.param('text')))
    .padding(this.param('padding'))
    .spiral(this.param('spiral'))
    .rotate(get(this.param('rotate')))
    .font(get(this.param('font')))
    .fontStyle(get(this.param('fontStyle')))
    .fontWeight(get(this.param('fontWeight')))
    .fontSize(fontSize)
    .words(data.map(wrap)) // wrap to avoid tuple writes
    .on('end', function(words) {
      var size = layout.size(),
          dx = size[0] >> 1,
          dy = size[1] >> 1,
          w, t, i, len;

      for (i=0, len=words.length; i<len; ++i) {
        w = words[i];
        t = w._tuple;
        Tuple.set(t, output.x, w.x + dx);
        Tuple.set(t, output.y, w.y + dy);
        Tuple.set(t, output.font, w.font);
        Tuple.set(t, output.fontSize, w.size);
        Tuple.set(t, output.fontStyle, w.style);
        Tuple.set(t, output.fontWeight, w.weight);
        Tuple.set(t, output.rotate, w.rotate);
      }
    })
    .start();

  // return changeset
  for (var key in output) input.fields[output[key]] = 1;
  return input;
};

module.exports = Wordcloud;

var Parameter = require('./Parameter');
Wordcloud.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Wordcloud transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["wordcloud"]},
    "size": {
      "description": "The dimensions of the wordcloud layout",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [900, 500]
    },
    "font": {
      "description": "The font face to use for a word.",
      "oneOf": [{"type": "string"}, Parameter.schema, {"$ref": "#/refs/signal"}],
      "default": "sans-serif"
    },
    "fontStyle": {
      "description": "The font style to use for a word.",
      "oneOf": [{"type": "string"}, Parameter.schema, {"$ref": "#/refs/signal"}],
      "default": "normal"
    },
    "fontWeight": {
      "description": "The font weight to use for a word.",
      "oneOf": [{"type": "string"}, Parameter.schema, {"$ref": "#/refs/signal"}],
      "default": "normal"
    },
    "fontSize": {
      "description": "The font size to use for a word.",
      "oneOf": [{"type": "number"}, Parameter.schema, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": 14
    },
    "fontScale": {
      "description": "The minimum and maximum scaled font sizes, or null to prevent scaling.",
      "oneOf": [
        { "type": "null" },
        {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {"oneOf": [{"type":"number"}, {"$ref": "#/refs/signal"}]}
        }
      ],
      "default": [10, 50]
    },
    "rotate": {
      "description": "The field or number to set the roration angle (in degrees).",
      "oneOf": [
        {"type": "number"}, {"type": "string"},
        Parameter.schema, {"$ref": "#/refs/signal"}
      ],
      "default": 0
    },
    "text": {
      "description": "The field containing the text to use for each word.",
      "oneOf": [{"type": "string"}, Parameter.schema, {"$ref": "#/refs/signal"}],
      "default": 'data'
    },
    "spiral": {
      "description": "The type of spiral used for positioning words, either 'archimedean' or 'rectangular'.",
      "oneOf": [{"enum": ["archimedean", "rectangular"]}, Parameter.schema, {"$ref": "#/refs/signal"}],
      "default": "archimedean"
    },
    "padding": {
      "description": "The padding around each word.",
      "oneOf": [{"type": "number"}, Parameter.schema, {"$ref": "#/refs/signal"}],
      "default": 1
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"},
        "font": {"type": "string", "default": "layout_font"},
        "fontSize": {"type": "string", "default": "layout_fontSize"},
        "fontStyle": {"type": "string", "default": "layout_fontStyle"},
        "fontWeight": {"type": "string", "default": "layout_fontWeight"},
        "rotate": {"type": "string", "default": "layout_rotate"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};
