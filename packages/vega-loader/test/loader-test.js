var tape = require('tape'),
    vega = require('../'),
    loader = vega.loader();

var host = 'vega.github.io';
var dir = '/datalib/';
var base = 'http://' + host + dir;
var uri = 'data/flare.json';
var url = base + uri;
var rel = '//' + host + dir + uri;
var file = './test/' + uri;
var fake = 'http://globalhost/invalid.dne';
var text = require('fs').readFileSync(file, 'utf8');

function sanityTest(test, uri, options, result) {
  if (result != null) {
    return loader.sanitize(uri, options)
      .then(function(opt) { test.equal(opt.href, result); })
      .catch(function(e) { test.fail(e); });
  } else {
    return loader.sanitize(uri, options)
      .then(function() { test.fail(); })
      .catch(function() { test.pass('fails appropriately'); });
  }
}

tape('loader should sanitize url', function(test) {
  Promise.all([
      sanityTest(test, 'a.txt', {mode: 'file'}, 'file://a.txt'),
      sanityTest(test, 'a.txt', {mode: 'http', baseURL: 'hostname'}, 'hostname/a.txt'),
      sanityTest(test, 'a.txt', {mode: 'http', baseURL: 'hostname/'}, 'hostname/a.txt'),
      sanityTest(test, '//h.com/a.txt', {}, 'http://h.com/a.txt'),
      sanityTest(test, '//h.com/a.txt', {defaultProtocol: 'https'}, 'https://h.com/a.txt'),
      sanityTest(test, undefined, {}, null),
      sanityTest(test, null, {}, null)
    ])
    .then(function() { test.end(); })
    .catch(function() { test.end(); });
});

tape('loader should resolve error for missing url', function(test) {
  loader.load(undefined)
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass('fails appropriately'); test.end(); });
});

tape('loader should resolve error for empty url string', function(test) {
  loader.load('')
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass('fails appropriately'); test.end(); });
});

tape('loader should load from file path', function(test) {
  loader.load(file, {file: true})
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should infer file load in node', function(test) {
  loader.load(file)
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should load from file url', function(test) {
  loader.load('file://' + file)
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should load from http url', function(test) {
  loader.load(url)
    .then(function(data) {
      test.equal(data, text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should load from http with headers', function(test) {
  loader.load(url, {headers: {'User-Agent': 'vega'}})
    .then(function(data) {
      test.equal(data, text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should resolve error with invalid url', function(test) {
  loader.load(url + '.invalid')
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass('fails appropriately'); test.end(); });
});

tape('loader should load from http base url + uri', function(test) {
  loader.load(uri, {mode: 'http', baseURL: base})
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should load from relative protocol http url', function(test) {
  loader.load(rel)
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should load from relative protocol file url', function(test) {
  loader.load('//'+file, {defaultProtocol: 'file'})
    .then(function(data) {
      test.equal(data+'', text);
      test.end();
    })
    .catch(function(e) { test.fail(e); test.end(); });
});

tape('loader should resolve error for invalid protocol', function(test) {
  loader.load('htsp://globalhost/invalid.dne')
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass('fails appropriately'); test.end(); });
});

tape('loader should resolve error on failed request', function(test) {
  loader.load(fake)
    .then(function() { test.fail(); test.end(); })
    .catch(function() { test.pass('fails appropriately'); test.end(); });
});
