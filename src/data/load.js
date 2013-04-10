vg.data.load = function(uri, callback) {
  if (vg.config.isNode) {
    // in node.js, consult base url and select file or http
    var url = vg_load_hasProtocol(uri) ? uri : vg.config.baseURL + uri,
        get = vg_load_isFile(url) ? vg_load_file : vg_load_http;
    get(url, callback);
  } else {
    // in browser, use xhr
    vg_load_xhr(uri, callback);
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
  d3.xhr(url, function(err, resp) {
    if (resp) resp = resp.responseText;
    callback(err, resp);
  });
}

function vg_load_file(file, callback) {
  vg.log("LOAD FILE: " + file);
  var idx = file.indexOf(vg_load_fileProtocol);
  if (idx >= 0) file = file.slice(vg_load_fileProtocol.length);
	require("fs").readFile(file, {encoding:"utf8"}, callback);
}

function vg_load_http(url, callback) {
  vg.log("LOAD HTTP: " + url);
	var req = require("http").request(url, function(res) {
    var data = "";
    res.setEncoding("utf8");
		res.on("error", function(err) { callback(err, null); });
		res.on("data", function(chunk) { data += chunk; });
		res.on("end", function() { callback(null, data); });
	});
	req.on("error", function(err) { callback(err); });
	req.end();
}