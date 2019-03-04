var vega = require('../'), loader = vega.loader();

var host = 'vega.github.io';
var dir = '/datalib/';
var base = 'http://' + host + dir;
var uri = 'data/flare.json';
var url = base + uri;
var rel = '//' + host + dir + uri;
var file = __dirname + '/' + uri;
var fake = 'https://vega.github.io/vega/dne.html';
var text = require('fs').readFileSync(file, 'utf8');

test('loader should sanitize url', async function() {
  await expect(loader.sanitize('a.txt', {mode: 'file'})).resolves.toMatchObject({href: 'a.txt'});
  await expect(loader.sanitize('a.txt', {mode: 'http', baseURL: 'hostname'})).resolves.toMatchObject({href: 'hostname/a.txt'});
  await expect(loader.sanitize('a.txt', {mode: 'http', baseURL: 'hostname/'})).resolves.toMatchObject({href: 'hostname/a.txt'});
  await expect(loader.sanitize('//h.com/a.txt', {})).resolves.toMatchObject({href: 'http://h.com/a.txt'});
  await expect(loader.sanitize('//h.com/a.txt', {defaultProtocol: 'https'})).resolves.toMatchObject({href: 'https://h.com/a.txt'});
  await expect(loader.sanitize(undefined, {})).rejects.toBeTruthy();
  await expect(loader.sanitize(null, {})).rejects.toBeTruthy();
});

test('loader should resolve error for missing url', async function() {
  await expect(loader.load(undefined)).rejects.toBeTruthy();
});

test('loader should resolve error for empty url string', async function() {
  await expect(loader.load('')).rejects.toBeTruthy();
});

test('loader should load from file path', async function() {
  var data = await loader.load(file, {file: true});
  expect(data + '').toBe(text);
});

test('loader should infer file load in node', async function() {
  var data = await loader.load(file);
  expect(data + '').toBe(text);
});

test('loader should load from file url', async function() {
  var data = await loader.load('file://' + file);
  expect(data + '').toBe(text);
});

test('loader should load from http url', async function() {
  await expect(loader.load(url)).resolves.toBe(text);
});

test('loader should load from http with headers', async function() {
  await expect(loader.load(url, {headers: {'User-Agent': 'vega'}})).resolves.toBe(text);
});

test('loader should resolve error with invalid url', async function() {
  await expect(loader.load(url + '.invalid')).rejects.toBeTruthy();
});

test('loader should load from http base url + uri', async function() {
  var data = await loader.load(uri, {mode: 'http', baseURL: base});
  expect(data + '').toBe(text);
});

test('loader should load from relative protocol http url', async function() {
  var data = await loader.load(rel);
  expect(data + '').toBe(text);
});

test('loader should load from relative protocol file url', async function() {
  var data = await loader.load('//'+file, {defaultProtocol: 'file'});
  expect(data + '').toBe(text);
});

test('loader should resolve error for invalid protocol', async function() {
  await expect(loader.load('htsp://globalhost/invalid.dne')).rejects.toBeTruthy();
});

test('loader should resolve error on failed request', async function() {
  await expect(loader.load(fake)).rejects.toBeTruthy();
});
