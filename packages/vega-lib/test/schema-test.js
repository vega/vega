var tape = require('tape'),
    vega = require('../'), // eslint-disable-line no-unused-vars
    tv4 = require('tv4'),
    fs = require('fs'),
    schema = require('../build/vega-schema.json'),
    validSpecs = require('./specs-valid.json'),
    invalidSpecs = require('./specs-invalid.json');

function validate(spec) {
  return tv4.validate(spec, schema);
}

tape('JSON schema recognizes valid specifications', function(test) {
  var dir = process.cwd() + '/test/specs-valid/';
  validSpecs.forEach(function(file) {
    var spec = JSON.parse(fs.readFileSync(dir + file + '.vg.json'));
    test.ok(validate(spec),
      'valid schema: ' + file + (tv4.error ? '\n' + tv4.error : ''));
  });

  test.end();
});

tape('JSON schema recognizes invalid specifications', function(test) {
  var dir = process.cwd() + '/test/specs-invalid/';
  invalidSpecs.forEach(function(file) {
    var specs = JSON.parse(fs.readFileSync(dir + file + '.json'));
    specs.forEach(function(spec, index) {
      test.notOk(validate(spec),
        'invalid schema (' + index + '): ' + file);
    });
  });

  test.end();
});
