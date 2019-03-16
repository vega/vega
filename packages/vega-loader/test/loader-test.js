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
var fake = 'https://vega.github.io/vega/dne.html';
var text = require('fs').readFileSync(file, 'utf8');

function sanityTest(t, uri, options, result) {
  if (result != null) {
    return loader.sanitize(uri, options)
      .then(function(opt) { t.equal(opt.href, result); })
      .catch(function(e) { t.fail(e); });
  } else {
    return loader.sanitize(uri, options)
      .then(function() { t.fail(); })
      .catch(function() { t.pass('fails appropriately'); });
  }
}

tape('loader should sanitize url', function(t) {
  Promise.all([
      sanityTest(t, 'a.txt', {mode: 'file'}, 'a.txt'),
      sanityTest(t, 'a.txt', {mode: 'http', baseURL: 'hostname'}, 'hostname/a.txt'),
      sanityTest(t, 'a.txt', {mode: 'http', baseURL: 'hostname/'}, 'hostname/a.txt'),
      sanityTest(t, '//h.com/a.txt', {}, 'http://h.com/a.txt'),
      sanityTest(t, '//h.com/a.txt', {defaultProtocol: 'https'}, 'https://h.com/a.txt'),
      sanityTest(t, undefined, {}, null),
      sanityTest(t, null, {}, null)
    ])
    .then(function() { t.end(); })
    .catch(function() { t.end(); });
});

tape('loader should resolve error for missing url', function(t) {
  loader.load(undefined)
    .then(function() { t.fail(); t.end(); })
    .catch(function() { t.pass('fails appropriately'); t.end(); });
});

tape('loader should resolve error for empty url string', function(t) {
  loader.load('')
    .then(function() { t.fail(); t.end(); })
    .catch(function() { t.pass('fails appropriately'); t.end(); });
});

tape('loader should load from file path', function(t) {
  loader.load(file, {file: true})
    .then(function(data) {
      t.equal(data+'', text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should infer file load in node', function(t) {
  loader.load(file)
    .then(function(data) {
      t.equal(data+'', text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should load from file url', function(t) {
  loader.load('file://' + file)
    .then(function(data) {
      t.equal(data+'', text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should load from http url', function(t) {
  loader.load(url)
    .then(function(data) {
      t.equal(data, text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should load from http with headers', function(t) {
  loader.load(url, {headers: {'User-Agent': 'vega'}})
    .then(function(data) {
      t.equal(data, text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should resolve error with invalid url', function(t) {
  loader.load(url + '.invalid')
    .then(function() { t.fail(); t.end(); })
    .catch(function() { t.pass('fails appropriately'); t.end(); });
});

tape('loader should load from http base url + uri', function(t) {
  loader.load(uri, {mode: 'http', baseURL: base})
    .then(function(data) {
      t.equal(data+'', text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should load from relative protocol http url', function(t) {
  loader.load(rel)
    .then(function(data) {
      t.equal(data+'', text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should load from relative protocol file url', function(t) {
  loader.load('//'+file, {defaultProtocol: 'file'})
    .then(function(data) {
      t.equal(data+'', text);
      t.end();
    })
    .catch(function(e) { t.fail(e); t.end(); });
});

tape('loader should resolve error for invalid protocol', function(t) {
  loader.load('htsp://globalhost/invalid.dne')
    .then(function() { t.fail(); t.end(); })
    .catch(function() { t.pass('fails appropriately'); t.end(); });
});

tape('loader should resolve error on failed request', function(t) {
  loader.load(fake)
    .then(function() { t.fail(); t.end(); })
    .catch(function() { t.pass('fails appropriately'); t.end(); });
});
