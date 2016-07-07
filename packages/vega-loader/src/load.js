import {request} from 'd3-request';

export default function load(uri, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!callback) throw Error('Missing callback function.');
  try {
    load.loader(uri, options || {}, callback);
  } catch (error) {
    callback(error);
  }
}

load.loader = loader;
load.sanitize = sanitize;
load.http = http;
load.file = file;

function loader(uri, options, callback) {
  var url = load.sanitize(uri, options);

  if (!url) {
    callback('Invalid URL: ' + uri);
  } else if (startsWith(url, fileProtocol)) {
    load.file(url.slice(fileProtocol.length), callback);
  } else {
    load.http(url, options, callback);
  }
}

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

function sanitize(uri, options) {
  if (uri == null) return null;

  var isFile = startsWith(uri, fileProtocol),
      hasProtocol = protocol_re.test(uri),
      loadFile, base;

  // should we load from file system?
  loadFile = isFile
    || options.mode === 'file'
    || options.mode !== 'http' && !hasProtocol && fs();
  if (loadFile) {
    return (isFile ? '' : fileProtocol) + uri;
  }

  // if relative url (no protocol/host), prepend baseURL
  if ((base = options.baseURL) && !hasProtocol) {
    // Ensure that there is a slash between the baseURL (e.g. hostname) and url
    if (!startsWith(uri, '/') && base[base.length-1] !== '/') {
      uri = '/' + uri;
    }
    uri = base + uri;
  }

  // if relative protocol (starts with '//'), prepend default protocol
  if (startsWith(uri, '//')) {
    uri = (options.defaultProtocol || 'http') + ':' + uri;
  }

  return uri;
}

var requestOptions = [
  'mimeType',
  'responseType',
  'user',
  'password'
];

function http(url, options, callback) {
  var req = request(url),
      name;

  for (name in options.headers) {
    req.header(name, options.headers[name]);
  }

  requestOptions.forEach(function(name) {
    if (options[name]) req[name](options[name]);
  });

  req.on('error', function(error) {
      callback(error || 'Error loading URL: ' + url);
    })
    .on('load', function(result) {
      var text = result && result.responseText;
      (!result || result.status === 0)
        ? callback(text || 'Error')
        : callback(null, text);
    })
    .get();
}

function file(filename, callback) {
  fs().readFile(filename, callback);
}

function fs() {
  var fs = typeof require === 'function' && require('fs');
  return fs || {
    readFile: function(filename, callback) {
      callback('No file system access for ' + filename);
    }
  };
}

function startsWith(string, query) {
  return string == null ? false : string.lastIndexOf(query, 0) === 0;
}
