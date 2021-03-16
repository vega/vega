var tape = require('tape'),
    vega = require('../'),
    loader = vega.loader();

const host = 'vega.github.io';
const dir = '/datalib/';
const base = 'http://' + host + dir;
const uri = 'data/flare.json';
const url = base + uri;
const rel = '//' + host + dir + uri;
const file = './test/' + uri;
const fake = 'https://vega.github.io/vega/dne.html';
const text = require('fs').readFileSync(file, 'utf8');

function testSanitize(t, uri, options, result) {
  if (result != null) {
    return loader.sanitize(uri, options)
      .then(opt => { t.equal(opt.href, result); })
      .catch(e => { t.fail(e); });
  } else {
    return loader.sanitize(uri, options)
      .then(() => { t.fail(); })
      .catch(() => { t.pass('fails appropriately'); });
  }
}

tape('loader should sanitize url', t => {
  Promise.all([
      testSanitize(t, 'a.txt', {mode: 'file'}, 'a.txt'),
      testSanitize(t, 'a.txt', {mode: 'http', baseURL: 'hostname'}, 'hostname/a.txt'),
      testSanitize(t, 'a.txt', {mode: 'http', baseURL: 'hostname/'}, 'hostname/a.txt'),
      testSanitize(t, '//h.com/a.txt', {}, 'http://h.com/a.txt'),
      testSanitize(t, '//h.com/a.txt', {defaultProtocol: 'https'}, 'https://h.com/a.txt'),
      testSanitize(t, undefined, {}, null),
      testSanitize(t, null, {}, null),
      testSanitize(t, 'javascript:alert("hello")', {}, null)
    ])
    .then(() => { t.end(); })
    .catch(() => { t.end(); });
});

tape('loader should resolve error for missing url', t => {
  loader.load(undefined)
    .then(() => { t.fail(); t.end(); })
    .catch(() => { t.pass('fails appropriately'); t.end(); });
});

tape('loader should resolve error for empty url string', t => {
  loader.load('')
    .then(() => { t.fail(); t.end(); })
    .catch(() => { t.pass('fails appropriately'); t.end(); });
});

tape('loader should load from file path', t => {
  loader.load(file, {file: true})
    .then(data => {
      t.equal(data+'', text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should infer file load in node', t => {
  loader.load(file)
    .then(data => {
      t.equal(data+'', text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should load from file url', t => {
  loader.load('file://' + file)
    .then(data => {
      t.equal(data+'', text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should load from http url', t => {
  loader.load(url)
    .then(data => {
      t.equal(data, text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should load from http with headers', t => {
  loader.load(url, {headers: {'User-Agent': 'vega'}})
    .then(data => {
      t.equal(data, text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should resolve error with invalid url', t => {
  loader.load(url + '.invalid')
    .then(() => { t.fail(); t.end(); })
    .catch(() => { t.pass('fails appropriately'); t.end(); });
});

tape('loader should load from http base url + uri', t => {
  loader.load(uri, {mode: 'http', baseURL: base})
    .then(data => {
      t.equal(data+'', text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should load from relative protocol http url', t => {
  loader.load(rel)
    .then(data => {
      t.equal(data+'', text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should load from relative protocol file url', t => {
  loader.load('//'+file, {defaultProtocol: 'file'})
    .then(data => {
      t.equal(data+'', text);
      t.end();
    })
    .catch(e => { t.fail(e); t.end(); });
});

tape('loader should resolve error for invalid protocol', t => {
  loader.load('htsp://globalhost/invalid.dne')
    .then(() => { t.fail(); t.end(); })
    .catch(() => { t.pass('fails appropriately'); t.end(); });
});

tape('loader should resolve error on failed request', t => {
  loader.load(fake)
    .then(() => { t.fail(); t.end(); })
    .catch(() => { t.pass('fails appropriately'); t.end(); });
});
