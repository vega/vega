(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-util'), require('topojson-client'), require('vega-format')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-util', 'topojson-client', 'vega-format'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}, global.vega, global.topojson, global.vega));
})(this, (function (exports, vegaUtil, topojsonClient, vegaFormat) { 'use strict';

  // Matches absolute URLs with optional protocol
  //   https://...    file://...    //...
  const protocol_re = /^(data:|([A-Za-z]+:)?\/\/)/;

  // Matches allowed URIs. From https://github.com/cure53/DOMPurify/blob/master/src/regexp.js with added file://
  const allowed_re = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|file|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i; // eslint-disable-line no-useless-escape
  const whitespace_re = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex

  // Special treatment in node.js for the file: protocol
  const fileProtocol = 'file://';

  /**
   * Factory for a loader constructor that provides methods for requesting
   * files from either the network or disk, and for sanitizing request URIs.
   * @param {function} fetch - The Fetch API for HTTP network requests.
   *   If null or undefined, HTTP loading will be disabled.
   * @param {object} fs - The file system interface for file loading.
   *   If null or undefined, local file loading will be disabled.
   * @return {function} A loader constructor with the following signature:
   *   param {object} [options] - Optional default loading options to use.
   *   return {object} - A new loader instance.
   */
  function loaderFactory (fetch, fs) {
    return options => ({
      options: options || {},
      sanitize: sanitize,
      load: load,
      fileAccess: !!fs,
      file: fileLoader(fs),
      http: httpLoader(fetch)
    });
  }

  /**
   * Load an external resource, typically either from the web or from the local
   * filesystem. This function uses {@link sanitize} to first sanitize the uri,
   * then calls either {@link http} (for web requests) or {@link file} (for
   * filesystem loading).
   * @param {string} uri - The resource indicator (e.g., URL or filename).
   * @param {object} [options] - Optional loading options. These options will
   *   override any existing default options.
   * @return {Promise} - A promise that resolves to the loaded content.
   */
  async function load(uri, options) {
    const opt = await this.sanitize(uri, options),
      url = opt.href;
    return opt.localFile ? this.file(url) : this.http(url, options);
  }

  /**
   * URI sanitizer function.
   * @param {string} uri - The uri (url or filename) to check.
   * @param {object} options - An options hash.
   * @return {Promise} - A promise that resolves to an object containing
   *  sanitized uri data, or rejects it the input uri is deemed invalid.
   *  The properties of the resolved object are assumed to be
   *  valid attributes for an HTML 'a' tag. The sanitized uri *must* be
   *  provided by the 'href' property of the returned object.
   */
  async function sanitize(uri, options) {
    options = vegaUtil.extend({}, this.options, options);
    const fileAccess = this.fileAccess,
      result = {
        href: null
      };
    let isFile, loadFile, base;
    const isAllowed = allowed_re.test(uri.replace(whitespace_re, ''));
    if (uri == null || typeof uri !== 'string' || !isAllowed) {
      vegaUtil.error('Sanitize failure, invalid URI: ' + vegaUtil.stringValue(uri));
    }
    const hasProtocol = protocol_re.test(uri);

    // if relative url (no protocol/host), prepend baseURL
    if ((base = options.baseURL) && !hasProtocol) {
      // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      if (!uri.startsWith('/') && !base.endsWith('/')) {
        uri = '/' + uri;
      }
      uri = base + uri;
    }

    // should we load from file system?
    loadFile = (isFile = uri.startsWith(fileProtocol)) || options.mode === 'file' || options.mode !== 'http' && !hasProtocol && fileAccess;
    if (isFile) {
      // strip file protocol
      uri = uri.slice(fileProtocol.length);
    } else if (uri.startsWith('//')) {
      if (options.defaultProtocol === 'file') {
        // if is file, strip protocol and set loadFile flag
        uri = uri.slice(2);
        loadFile = true;
      } else {
        // if relative protocol (starts with '//'), prepend default protocol
        uri = (options.defaultProtocol || 'http') + ':' + uri;
      }
    }

    // set non-enumerable mode flag to indicate local file load
    Object.defineProperty(result, 'localFile', {
      value: !!loadFile
    });

    // set uri
    result.href = uri;

    // set default result target, if specified
    if (options.target) {
      result.target = options.target + '';
    }

    // set default result rel, if specified (#1542)
    if (options.rel) {
      result.rel = options.rel + '';
    }

    // provide control over cross-origin image handling (#2238)
    // https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
    if (options.context === 'image' && options.crossOrigin) {
      result.crossOrigin = options.crossOrigin + '';
    }

    // return
    return result;
  }

  /**
   * File system loader factory.
   * @param {object} fs - The file system interface.
   * @return {function} - A file loader with the following signature:
   *   param {string} filename - The file system path to load.
   *   param {string} filename - The file system path to load.
   *   return {Promise} A promise that resolves to the file contents.
   */
  function fileLoader(fs) {
    return fs ? filename => new Promise((accept, reject) => {
      fs.readFile(filename, (error, data) => {
        if (error) reject(error);else accept(data);
      });
    }) : fileReject;
  }

  /**
   * Default file system loader that simply rejects.
   */
  async function fileReject() {
    vegaUtil.error('No file system access.');
  }

  /**
   * HTTP request handler factory.
   * @param {function} fetch - The Fetch API method.
   * @return {function} - An http loader with the following signature:
   *   param {string} url - The url to request.
   *   param {object} options - An options hash.
   *   return {Promise} - A promise that resolves to the file contents.
   */
  function httpLoader(fetch) {
    return fetch ? async function (url, options) {
      const opt = vegaUtil.extend({}, this.options.http, options),
        type = options && options.response,
        response = await fetch(url, opt);
      return !response.ok ? vegaUtil.error(response.status + '' + response.statusText) : vegaUtil.isFunction(response[type]) ? response[type]() : response.text();
    } : httpReject;
  }

  /**
   * Default http request handler that simply rejects.
   */
  async function httpReject() {
    vegaUtil.error('No HTTP fetch method available.');
  }

  const isValid = _ => _ != null && _ === _;
  const isBoolean = _ => _ === 'true' || _ === 'false' || _ === true || _ === false;
  const isDate = _ => !Number.isNaN(Date.parse(_));
  const isNumber = _ => !Number.isNaN(+_) && !(_ instanceof Date);
  const isInteger = _ => isNumber(_) && Number.isInteger(+_);
  const typeParsers = {
    boolean: vegaUtil.toBoolean,
    integer: vegaUtil.toNumber,
    number: vegaUtil.toNumber,
    date: vegaUtil.toDate,
    string: vegaUtil.toString,
    unknown: vegaUtil.identity
  };
  const typeTests = [isBoolean, isInteger, isNumber, isDate];
  const typeList = ['boolean', 'integer', 'number', 'date'];
  function inferType(values, field) {
    if (!values || !values.length) return 'unknown';
    const n = values.length,
      m = typeTests.length,
      a = typeTests.map((_, i) => i + 1);
    for (let i = 0, t = 0, j, value; i < n; ++i) {
      value = field ? values[i][field] : values[i];
      for (j = 0; j < m; ++j) {
        if (a[j] && isValid(value) && !typeTests[j](value)) {
          a[j] = 0;
          ++t;
          if (t === typeTests.length) return 'string';
        }
      }
    }
    return typeList[a.reduce((u, v) => u === 0 ? v : u, 0) - 1];
  }
  function inferTypes(data, fields) {
    return fields.reduce((types, field) => {
      types[field] = inferType(data, field);
      return types;
    }, {});
  }

  var EOL = {},
    EOF = {},
    QUOTE = 34,
    NEWLINE = 10,
    RETURN = 13;
  function objectConverter(columns) {
    return new Function("d", "return {" + columns.map(function (name, i) {
      return JSON.stringify(name) + ": d[" + i + "] || \"\"";
    }).join(",") + "}");
  }
  function customConverter(columns, f) {
    var object = objectConverter(columns);
    return function (row, i) {
      return f(object(row), i, columns);
    };
  }

  // Compute unique columns in order of discovery.
  function inferColumns(rows) {
    var columnSet = Object.create(null),
      columns = [];
    rows.forEach(function (row) {
      for (var column in row) {
        if (!(column in columnSet)) {
          columns.push(columnSet[column] = column);
        }
      }
    });
    return columns;
  }
  function pad(value, width) {
    var s = value + "",
      length = s.length;
    return length < width ? new Array(width - length + 1).join(0) + s : s;
  }
  function formatYear(year) {
    return year < 0 ? "-" + pad(-year, 6) : year > 9999 ? "+" + pad(year, 6) : pad(year, 4);
  }
  function formatDate(date) {
    var hours = date.getUTCHours(),
      minutes = date.getUTCMinutes(),
      seconds = date.getUTCSeconds(),
      milliseconds = date.getUTCMilliseconds();
    return isNaN(date) ? "Invalid Date" : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2) + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z" : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z" : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z" : "");
  }
  function dsvFormat (delimiter) {
    var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
      DELIMITER = delimiter.charCodeAt(0);
    function parse(text, f) {
      var convert,
        columns,
        rows = parseRows(text, function (row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
      rows.columns = columns || [];
      return rows;
    }
    function parseRows(text, f) {
      var rows = [],
        // output rows
        N = text.length,
        I = 0,
        // current character index
        n = 0,
        // current line number
        t,
        // current token
        eof = N <= 0,
        // current token followed by EOF?
        eol = false; // current token followed by EOL?

      // Strip the trailing newline.
      if (text.charCodeAt(N - 1) === NEWLINE) --N;
      if (text.charCodeAt(N - 1) === RETURN) --N;
      function token() {
        if (eof) return EOF;
        if (eol) return eol = false, EOL;

        // Unescape quotes.
        var i,
          j = I,
          c;
        if (text.charCodeAt(j) === QUOTE) {
          while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
          if ((i = I) >= N) eof = true;else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;else if (c === RETURN) {
            eol = true;
            if (text.charCodeAt(I) === NEWLINE) ++I;
          }
          return text.slice(j + 1, i - 1).replace(/""/g, "\"");
        }

        // Find next delimiter or newline.
        while (I < N) {
          if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;else if (c === RETURN) {
            eol = true;
            if (text.charCodeAt(I) === NEWLINE) ++I;
          } else if (c !== DELIMITER) continue;
          return text.slice(j, i);
        }

        // Return last token before EOF.
        return eof = true, text.slice(j, N);
      }
      while ((t = token()) !== EOF) {
        var row = [];
        while (t !== EOL && t !== EOF) row.push(t), t = token();
        if (f && (row = f(row, n++)) == null) continue;
        rows.push(row);
      }
      return rows;
    }
    function preformatBody(rows, columns) {
      return rows.map(function (row) {
        return columns.map(function (column) {
          return formatValue(row[column]);
        }).join(delimiter);
      });
    }
    function format(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
    }
    function formatBody(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return preformatBody(rows, columns).join("\n");
    }
    function formatRows(rows) {
      return rows.map(formatRow).join("\n");
    }
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(value) {
      return value == null ? "" : value instanceof Date ? formatDate(value) : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\"" : value;
    }
    return {
      parse: parse,
      parseRows: parseRows,
      format: format,
      formatBody: formatBody,
      formatRows: formatRows,
      formatRow: formatRow,
      formatValue: formatValue
    };
  }

  function delimitedFormat(delimiter) {
    const parse = function (data, format) {
      const delim = {
        delimiter: delimiter
      };
      return dsv(data, format ? vegaUtil.extend(format, delim) : delim);
    };
    parse.responseType = 'text';
    return parse;
  }
  function dsv(data, format) {
    if (format.header) {
      data = format.header.map(vegaUtil.stringValue).join(format.delimiter) + '\n' + data;
    }
    return dsvFormat(format.delimiter).parse(data + '');
  }
  dsv.responseType = 'text';

  function isBuffer(_) {
    return typeof Buffer === 'function' && vegaUtil.isFunction(Buffer.isBuffer) ? Buffer.isBuffer(_) : false;
  }
  function json(data, format) {
    const prop = format && format.property ? vegaUtil.field(format.property) : vegaUtil.identity;
    return vegaUtil.isObject(data) && !isBuffer(data) ? parseJSON(prop(data), format) : prop(JSON.parse(data));
  }
  json.responseType = 'json';
  function parseJSON(data, format) {
    if (!vegaUtil.isArray(data) && vegaUtil.isIterable(data)) {
      data = [...data];
    }
    return format && format.copy ? JSON.parse(JSON.stringify(data)) : data;
  }

  const filters = {
    interior: (a, b) => a !== b,
    exterior: (a, b) => a === b
  };
  function topojson(data, format) {
    let method, object, property, filter;
    data = json(data, format);
    if (format && format.feature) {
      method = topojsonClient.feature;
      property = format.feature;
    } else if (format && format.mesh) {
      method = topojsonClient.mesh;
      property = format.mesh;
      filter = filters[format.filter];
    } else {
      vegaUtil.error('Missing TopoJSON feature or mesh parameter.');
    }
    object = (object = data.objects[property]) ? method(data, object, filter) : vegaUtil.error('Invalid TopoJSON object: ' + property);
    return object && object.features || [object];
  }
  topojson.responseType = 'json';

  const format = {
    dsv: dsv,
    csv: delimitedFormat(','),
    tsv: delimitedFormat('\t'),
    json: json,
    topojson: topojson
  };
  function formats(name, reader) {
    if (arguments.length > 1) {
      format[name] = reader;
      return this;
    } else {
      return vegaUtil.hasOwnProperty(format, name) ? format[name] : null;
    }
  }
  function responseType(type) {
    const f = formats(type);
    return f && f.responseType || 'text';
  }

  function read (data, schema, timeParser, utcParser) {
    schema = schema || {};
    const reader = formats(schema.type || 'json');
    if (!reader) vegaUtil.error('Unknown data format type: ' + schema.type);
    data = reader(data, schema);
    if (schema.parse) parse(data, schema.parse, timeParser, utcParser);
    if (vegaUtil.hasOwnProperty(data, 'columns')) delete data.columns;
    return data;
  }
  function parse(data, types, timeParser, utcParser) {
    if (!data.length) return; // early exit for empty data

    const locale = vegaFormat.timeFormatDefaultLocale();
    timeParser = timeParser || locale.timeParse;
    utcParser = utcParser || locale.utcParse;
    let fields = data.columns || Object.keys(data[0]),
      datum,
      field,
      i,
      j,
      n,
      m;
    if (types === 'auto') types = inferTypes(data, fields);
    fields = Object.keys(types);
    const parsers = fields.map(field => {
      const type = types[field];
      let parts, pattern;
      if (type && (type.startsWith('date:') || type.startsWith('utc:'))) {
        parts = type.split(/:(.+)?/, 2); // split on first :
        pattern = parts[1];
        if (pattern[0] === '\'' && pattern[pattern.length - 1] === '\'' || pattern[0] === '"' && pattern[pattern.length - 1] === '"') {
          pattern = pattern.slice(1, -1);
        }
        const parse = parts[0] === 'utc' ? utcParser : timeParser;
        return parse(pattern);
      }
      if (!typeParsers[type]) {
        throw Error('Illegal format pattern: ' + field + ':' + type);
      }
      return typeParsers[type];
    });
    for (i = 0, n = data.length, m = fields.length; i < n; ++i) {
      datum = data[i];
      for (j = 0; j < m; ++j) {
        field = fields[j];
        datum[field] = parsers[j](datum[field]);
      }
    }
  }

  const loader = loaderFactory(typeof fetch !== 'undefined' && fetch,
  // use built-in fetch API
  null // no file system access
  );

  exports.format = format;
  exports.formats = formats;
  exports.inferType = inferType;
  exports.inferTypes = inferTypes;
  exports.loader = loader;
  exports.read = read;
  exports.responseType = responseType;
  exports.typeParsers = typeParsers;

}));
