vg.data.read = (function() {
  var formats = {},
      parsers = {
        "number": vg.number,
        "boolean": vg.boolean
      };

  function read(data, format) {
    var type = (format && format.type) || "json";
    return formats[type](data, format);
  }

  formats.json = function(data, format) {
    var d = JSON.parse(data);
    if (format && format.property) {
      d = vg.accessor(format.property)(d);
    }
    return d;
  };

  formats.csv = function(data, format) {
    var d = d3.csv.parse(data);
    if (format.parse) parseValues(d, format.parse);
    return d;
  };

  formats.tsv = function(data, format) {
    var d = d3.tsv.parse(data);
    if (format.parse) parseValues(d, format.parse);
    return d;
  };
  
  function parseValues(data, types) {
    var cols = vg.keys(types),
        p = cols.map(function(col) { return parsers[types[col]]; }),
        d, i, j, len, clen;

    for (i=0, len=data.length; i<len; ++i) {
      d = data[i];
      for (j=0, clen=cols.length; j<clen; ++j) {
        d[cols[j]] = p[j](d[cols[j]]);
      }
    }
  }

  read.formats = formats;
  return read;
})();