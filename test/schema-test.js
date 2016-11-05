var tape = require('tape'),
    vega = require('../'), // eslint-disable-line no-unused-vars
    tv4 = require('tv4'),
    fs = require('fs'),
    schema = require('../build/vega-schema.json'),
    specs = require('./specs.json');

var dir = process.cwd() + '/spec/';

function validate(spec) {
  return tv4.validate(spec, schema);
}

tape('JSON schema validates correct specifications', function(test) {
  specs.forEach(function(file) {
    var spec = JSON.parse(fs.readFileSync(dir + file + '.vg.json')),
        pass = validate(spec);
    test.ok(pass, 'schema: ' + file + (tv4.error ? '\n' + tv4.error : ''));
  });

  test.end();
});