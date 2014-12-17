vg.data.load = function(uri, callback) {
  var url = vg_load_hasProtocol(uri) ? uri : vg.config.baseURL + uri;
  if (vg.config.isNode) {
    // in node.js, consult url and select file or http
    var get = vg_load_isFile(url) ? vg_load_file : vg_load_http;
    get(url, callback);
  } else {
    // in browser, use xhr
    vg_load_xhr(url, callback);
  }  
};

var vg_load_protocolRE = /^[A-Za-z]+\:\/\//;
var vg_load_fileProtocol = "file://";

function vg_load_hasProtocol(url) {
  return vg_load_protocolRE.test(url);
}

function vg_load_isFile(url) {
  return url.indexOf(vg_load_fileProtocol) === 0;
}

function vg_load_xhr(url, callback) {
  vg.log("LOAD: " + url);
  if (!vg_url_check(url)) {
    vg.error("URL is not whitelisted: " + url);
    return;
  }
  d3.xhr(url, function(err, resp) {
    if (resp) resp = resp.responseText;
    callback(err, resp);
  });
}

function vg_url_check(url) {
  // If vg.config.domainWhiteList is set, only allows url, whose hostname
  // * Is the same as the origin (window.location.hostname)
  // * Equals one of the values in the whitelist
  // * Is a proper subdomain of one of the values in the whitelist
  if (!vg.config.domainWhiteList)
    return true;

  var a = document.createElement("a");
  a.href = url;
  var domain = a.hostname.toLowerCase();

  return window.location.hostname === domain ||
    vg.config.domainWhiteList.some(function(d) {
      var ind = domain.length - d.length;
      return d === domain ||
        (ind > 1 && domain[ind-1] === '.' && domain.lastIndexOf(d) === ind);
    });
}

function vg_load_file(file, callback) {
  vg.log("LOAD FILE: " + file);
  var idx = file.indexOf(vg_load_fileProtocol);
  if (idx >= 0) file = file.slice(vg_load_fileProtocol.length);
  require("fs").readFile(file, callback);
}

function vg_load_http(url, callback) {
  vg.log("LOAD HTTP: " + url);
	var req = require("http").request(url, function(res) {
    var pos=0, data = new Buffer(parseInt(res.headers['content-length'],10));
		res.on("error", function(err) { callback(err, null); });
		res.on("data", function(x) { x.copy(data, pos); pos += x.length; });
		res.on("end", function() { callback(null, data); });
	});
	req.on("error", function(err) { callback(err); });
	req.end();
}