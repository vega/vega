import {extend, stringValue} from 'vega-util';

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

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
export default function(fetch, fs) {
  return function(options) {
    return {
      options: options || {},
      sanitize: sanitize,
      load: load,
      fileAccess: !!fs,
      file: fileLoader(fs),
      http: httpLoader(fetch)
    };
  };
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
      return opt.localFile
        ? loader.file(url)
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
  options = extend({}, this.options, options);
  var fileAccess = this.fileAccess;

  return new Promise(function(accept, reject) {
    var result = {href: null},
        isFile, hasProtocol, loadFile, base;

    if (uri == null || typeof uri !== 'string') {
      reject('Sanitize failure, invalid URI: ' + stringValue(uri));
      return;
    }

    hasProtocol = protocol_re.test(uri);

    // if relative url (no protocol/host), prepend baseURL
    if ((base = options.baseURL) && !hasProtocol) {
      // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      if (!uri.startsWith('/') && base[base.length-1] !== '/') {
        uri = '/' + uri;
      }
      uri = base + uri;
    }

    // should we load from file system?
    loadFile = (isFile = uri.startsWith(fileProtocol))
      || options.mode === 'file'
      || options.mode !== 'http' && !hasProtocol && fileAccess;

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
    Object.defineProperty(result, 'localFile', {value: !!loadFile});

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

    // return
    accept(result);
  });
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
  return fs
    ? function(filename) {
        return new Promise(function(accept, reject) {
          fs.readFile(filename, function(error, data) {
            if (error) reject(error);
            else accept(data);
          });
        });
      }
    : fileReject;
}

/**
 * Default file system loader that simply rejects.
 */
function fileReject() {
  return Promise.reject('No file system access.');
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
  return fetch
    ? function(url, options) {
        return fetch(url, extend({}, this.options.http, options))
          .then(function(response) {
            if (!response.ok) throw response.status + '' + response.statusText;
            return response.text();
          });
      }
    : httpReject;
}

/**
 * Default http request handler that simply rejects.
 */
function httpReject() {
  return Promise.reject('No HTTP fetch method available.');
}
