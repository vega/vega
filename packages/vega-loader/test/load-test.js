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

tape('load should resolve error for missing url', function(test) {
  load(undefined)
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass(); test.end(); });
});

tape('load should resolve error for empty url string', function(test) {
  load('')
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass(); test.end(); });
});

tape('load should load from file path', function(test) {
  load(file, {file: true})
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should infer file load in node', function(test) {
  load(file)
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should load from file url', function(test) {
  load('file://' + file)
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should load from http url', function(test) {
  load(url)
    .then(function(data) {
      test.equal(data, text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should load from http with headers', function(test) {
  load(url, {headers: {'User-Agent': 'vega'}})
    .then(function(data) {
      test.equal(data, text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should resolve error with invalid url', function(test) {
  load(url + '.invalid')
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass(); test.end(); });
});

tape('load should load from http base url + uri', function(test) {
  load(uri, {mode: 'http', baseURL: base})
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should load from relative protocol http url', function(test) {
  load(rel)
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should load from relative protocol file url', function(test) {
  load('//'+file, {defaultProtocol: 'file'})
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function() { test.fail(); test.end(); });
});

tape('load should resolve error for invalid protocol', function(test) {
  load('htsp://globalhost/invalid.dne')
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass(); test.end(); });
});

tape('load should resolve error on failed request', function(test) {
  load(fake)
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass(); test.end(); });
});
