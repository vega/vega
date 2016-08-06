import {request} from 'd3-request';

/**
 * Load an external resource, typically either from the web
 * or from the local filesystem.
 * @param {string} uri - The resource indicator (e.g., URL or filename).
 * @param {object} [options] - Optional loading options.
 * @return {Promise} - A promise that resolves to the loaded content.
 */
export default function load(uri, options) {
  return load.loader(uri, options || {});
}

/**
 * Overridable load function. If not overridden, this function
 * uses load.sanitize to first sanitize the uri, then calls either
 * load.http (for web requests) or load.file (for filesystem loading).
 * @param {string} uri - The uri (url or filename) to sanity check.
 * @param {object} options - Loading options.
 * @return {Promise} - A promise that resolves to the loaded content.
 */
load.loader = loader;

/**
 * Overridable uri sanitizer function.
 * @param {string} uri - The uri (url or filename) to sanity chekc.
 * @param {object} options - An options hash.
 * @return {string} - The sanitized uri, or null if rejected.
 */
load.sanitize = sanitize;

/**
 * Overridable http request loader.
 * @param {string} url - The url to request.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to the file contents.
 */
load.http = http;

/**
 * Overridable file system loader.
 * @param {string} filename - The file system path to load.
 * @return {Promise} - A promise that resolves to the file contents.
 */
load.file = file;

function loader(uri, options) {
  var url = load.sanitize(uri, options);
  return !url ? Promise.reject('Invalid URL: ' + uri)
    : startsWith(url, fileProtocol)
      ? load.file(url.slice(fileProtocol.length))
      : load.http(url, options);
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

function http(url, options) {
  return new Promise(function(accept, reject) {
    var req = request(url),
        name;

    for (name in options.headers) {
      req.header(name, options.headers[name]);
    }

    requestOptions.forEach(function(name) {
      if (options[name]) req[name](options[name]);
    });

    req.on('error', function(error) {
        reject(error || 'Error loading URL: ' + url);
      })
      .on('load', function(result) {
        var text = result && result.responseText;
        (!result || result.status === 0)
          ? reject(text || 'Error')
          : accept(text);
      })
      .get();
  });
}

function file(filename) {
  return new Promise(function(accept, reject) {
    var f = fs();
    f ? f.readFile(filename, function(error, data) {
          if (error) reject(error);
          else accept(data);
        })
      : reject('No file system access for ' + filename);
  });
}

function fs() {
  return typeof require === 'function' && require('fs');
}

function startsWith(string, query) {
  return string == null ? false : string.lastIndexOf(query, 0) === 0;
}
