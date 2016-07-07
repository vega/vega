var tape = require('tape'),
    vega = require('../'),
    load = vega.load;

var host = 'vega.github.io';
var dir = '/datalib/';
var base = 'http://' + host + dir;
var uri = 'data/flare.json';
var url = base + uri;
var rel = '//' + host + dir + uri;
var file = './test/' + uri;
var fake = 'http://globalhost/invalid.dne';
var text = require('fs').readFileSync(file, 'utf8');

tape('load should sanitize url', function(test) {
  var $ = load.sanitize;
  test.equal($('a.txt', {mode: 'file'}), 'file://a.txt');
  test.equal($('a.txt', {mode: 'http', baseURL: 'hostname'}), 'hostname/a.txt');
  test.equal($('a.txt', {mode: 'http', baseURL: 'hostname/'}), 'hostname/a.txt');
  test.equal($('//h.com/a.txt', {}), 'http://h.com/a.txt');
  test.equal($('//h.com/a.txt', {defaultProtocol: 'https'}), 'https://h.com/a.txt');
  test.equal($(undefined, {}), null);
  test.equal($(null, {}), null);
  test.end();
});

tape('load should throw error if callback missing', function(test) {
  test.throws(function() { return load(url); });
  test.end();
});

tape('load should return error for missing url', function(test) {
  load(undefined, function(error, data) {
    test.ok(error);
    test.notOk(data);
    test.end();
  });
});

tape('load should return error for empty url string', function(test) {
  load('', function(error, data) {
    test.ok(error);
    test.notOk(data);
    test.end();
  });
});

tape('load should load from file path', function(test) {
  load(file, {file: true}, function(error, data) {
    test.equal(data+'', text);
    test.end();
  });
});

tape('load should infer file load in node', function(test) {
  load(file, function(error, data) {
    test.equal(data+'', text);
    test.end();
  });
});

tape('load should load from file url', function(test) {
  load('file://' + file, function(error, data) {
    test.equal(data+'', text);
    test.end();
  });
});

tape('load should load from http url', function(test) {
  load(url, function(error, data) {
    test.equal(data, text);
    test.end();
  });
});

tape('load should load from http with headers', function(test) {
  load(url, {headers: {'User-Agent': 'datalib'}}, function(error, data) {
    test.equal(data, text);
    test.end();
  });
});

tape('load should error with invalid url', function(test) {
  load(url+'.invalid', function(error, data) {
    test.ok(error);
    test.notOk(data);
    test.end();
  });
});

tape('load should load from http base url + uri', function(test) {
  load(uri, {mode: 'http', baseURL: base}, function(error, data) {
    test.equal(data+'', text);
    test.end();
  });
});

tape('load should load from relative protocol http url', function(test) {
  load(rel, function(error, data) {
    test.equal(data+'', text);
    test.end();
  });
});

tape('load should load from relative protocol file url', function(test) {
  load('//'+file, {defaultProtocol: 'file'}, function(error, data) {
    test.equal(data+'', text);
    test.end();
  });
});

tape('load should return error for invalid protocol', function(test) {
  load('htsp://globalhost/invalid.dne', function(error, data) {
    test.ok(error);
    test.notOk(data);
    test.end();
  });
});

tape('load should return error on failed request', function(test) {
  load(fake, function(error, data) {
    test.ok(error);
    test.notOk(data);
    test.end();
  });
});
