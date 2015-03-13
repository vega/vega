vg.data.load = (function() {

  // Matches absolute URLs with optional protocol
  //   https://...    file://...    //...
  var protocolRE = /^([A-Za-z]+:)?\/\//;

  // Special treatment in node.js for the file: protocol
  var fileProtocol = 'file://';

  // Validate and cleanup URL to ensure that it is allowed to be accessed
  // Returns cleaned up URL, or false if access is not allowed
  function sanitizeUrl(url) {
    // In case this is a relative url (has no host), prepend config.baseURL
    if (vg.config.baseURL && !protocolRE.test(url)) {
      if (!vg.startsWith(url, '/') && vg.config.baseURL[vg.config.baseURL.length-1] !== '/') {
        url = '/' + url; // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      }
      url = vg.config.baseURL + url;
    }
    // relative protocol, starts with '//'
    if (vg.config.isNode && vg.startsWith(url, '//')) {
      url = vg.config.defaultProtocol + url;
    }
    // If vg.config.domainWhiteList is set, only allows url, whose hostname
    // * Is the same as the origin (window.location.hostname)
    // * Equals one of the values in the whitelist
    // * Is a proper subdomain of one of the values in the whitelist
    if (vg.config.domainWhiteList) {
      var domain, origin;
      if (vg.config.isNode) {
        // relative protocol is broken: https://github.com/defunctzombie/node-url/issues/5
        var parts = require('url').parse(url);
        // In safe mode, make sure url begins with http:// or https://
        if (vg.config.safeMode && parts.protocol !== 'http:' && parts.protocol !== 'https:') {
          return false;
        }
        domain = parts.hostname;
        origin = null;
      } else {
        var a = document.createElement('a');
        a.href = url;
        // From http://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
        // IE doesn't populate all link properties when setting .href with a relative URL,
        // however .href will return an absolute URL which then can be used on itself
        // to populate these additional fields.
        if (a.host == "") {
          a.href = a.href;
        }
        domain = a.hostname.toLowerCase();
        origin = window.location.hostname;
      }

      if (origin !== domain) {
        var whiteListed = vg.config.domainWhiteList.some(function (d) {
          var idx = domain.length - d.length;
          return d === domain ||
            (idx > 1 && domain[idx-1] === '.' && domain.lastIndexOf(d) === idx);
        });
        if (!whiteListed) {
          vg.error('URL is not whitelisted: ' + url);
          url = false;
        }
      }
    }
    return url;
  }

  function load(uri, callback) {
    var url = vg.data.load.sanitizeUrl(uri); // allow sanitizer override
    if (!url) {
      callback('Bad URL', null);
    } else if (!vg.config.isNode) {
      // in browser, use xhr
      xhr(url, callback);
    } else if (vg.startsWith(url, fileProtocol)) {
      // in node.js, if url starts with 'file://', strip it and load from file
      file(url.slice(fileProtocol.length), callback);
    } else {
      // for regular URLs in node.js
      http(url, callback);
    }
  }

  function xhr(url, callback) {
    vg.log('LOAD XHR: ' + url);
    d3.xhr(url, function(err, resp) {
      if (resp) resp = resp.responseText;
      callback(err, resp);
    });
  }

  function file(file, callback) {
    vg.log('LOAD FILE: ' + file);
    require('fs').readFile(file, callback);
  }

  function http(url, callback) {
    vg.log('LOAD HTTP: ' + url);
    var req = require('request')(url, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        callback(null, body);
      } else {
        callback(error, null);
      }
    });
  }

  load.sanitizeUrl = sanitizeUrl;
  return load;
})();
