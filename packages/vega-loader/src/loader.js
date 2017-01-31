import {extend, isFunction, stringValue} from 'vega-util';
import {request} from 'd3-request';

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

// Request options to check for d3-request
var requestOptions = [
  'mimeType',
  'responseType',
  'user',
  'password'
];

/**
 * Creates a new loader instance that provides methods for requesting files
 * from either the network or disk, and for sanitizing request URIs.
 * @param {object} [options] - Optional default loading options to use.
 * @return {object} - A new loader instance.
 */
export default function(options) {
  return {
    options: options || {},
    sanitize: sanitize,
    load: load,
    file: file,
    http: http
  };
}

function marshall(loader, options) {
  return extend({}, loader.options, options);
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
function load(uri, options) {
  var loader = this;
  return loader.sanitize(uri, options)
    .then(function(opt) {
      var url = opt.href;
      return (startsWith(url, fileProtocol))
        ? loader.file(url.slice(fileProtocol.length))
        : loader.http(url, options);
    });
}

/**
 * URI sanitizer function.
 * @param {string} uri - The uri (url or filename) to sanity check.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to an object containing
 *  sanitized uri data, or rejects it the input uri is deemed invalid.
 *  The properties of the resolved object are assumed to be
 *  valid attributes for an HTML 'a' tag. The sanitized uri *must* be
 *  provided by the 'href' property of the returned object.
 */
function sanitize(uri, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var isFile, hasProtocol, loadFile, base;

    if (uri == null || typeof uri !== 'string') {
      reject('Sanitize failure, invalid URI: ' + stringValue(uri));
      return;
    }

    hasProtocol = protocol_re.test(uri);

    // if relative url (no protocol/host), prepend baseURL
    if ((base = options.baseURL) && !hasProtocol) {
      // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      if (!startsWith(uri, '/') && base[base.length-1] !== '/') {
        uri = '/' + uri;
      }
      uri = base + uri;
    }

    // should we load from file system?
    loadFile = (isFile = startsWith(uri, fileProtocol))
      || options.mode === 'file'
      || options.mode !== 'http' && !hasProtocol && fs();

    if (loadFile) {
      // prepend file protocol, if not already present
      uri = (isFile ? '' : fileProtocol) + uri;
    } else if (startsWith(uri, '//')) {
      // if relative protocol (starts with '//'), prepend default protocol
      uri = (options.defaultProtocol || 'http') + ':' + uri;
    }

    accept({href: uri});
  });
}

/**
 * HTTP request loader.
 * @param {string} url - The url to request.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to the file contents.
 */
function http(url, options) {
  options = marshall(this, options);
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

/**
 * File system loader.
 * @param {string} filename - The file system path to load.
 * @return {Promise} - A promise that resolves to the file contents.
 */
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
  var fs = typeof require === 'function' && require('fs');
  return fs && isFunction(fs.readFile) ? fs : null;
}

function startsWith(string, query) {
  return string == null ? false : string.lastIndexOf(query, 0) === 0;
}
