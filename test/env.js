// tests require that you first run "npm install" from repository root
jsdom = require("jsdom");
d3 = require("d3");
require("../vega");

var fs = require("fs");

// copied from d3's XMLHttpRequest test shim; needed for async example data urls
global.XMLHttpRequest = function XMLHttpRequest() {
  var self = this,
      info = self._info = {},
      headers = {},
      url;

  self.open = function(m, u, a) {
    info.url = u;
    info.async = a;
    self.send = a ? read : readSync;
  };

  self.setRequestHeader = function(n, v) {
    if (/^Accept$/i.test(n)) info.mimeType = v.split(/,/g)[0];
  };

  function read() {
    fs.readFile(info.url, "binary", function(e, d) {
      if (e) {
        self.status = 404; // assumed
      } else {
        self.status = 200;
        self.responseText = d;
        self.responseXML = {_xml: d};
        headers["Content-Length"] = d.length;
      }
      self.readyState = 4;
      XMLHttpRequest._last = self;
      if (self.onreadystatechange) self.onreadystatechange();
    });
  }

  function readSync() {
    try {
      var d = fs.readFileSync(info.url, "binary");
      self.status = 200;
      self.responseText = d;
      self.responseXML = {_xml: d};
      headers["Content-Length"] = d.length;
    } catch (e) {
      self.status = 404; // assumed
    }
    self.readyState = 4;
    XMLHttpRequest._last = self;
    if (self.onreadystatechange) self.onreadystatechange();
  }

  self.getResponseHeader = function(n) {
    return headers[n];
  };
};
