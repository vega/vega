var vega = require('../'), // eslint-disable-line no-unused-vars
    ajv = require('ajv'),
    fs = require('fs'),
    schema = require('../build/vega-schema.json'),
    validSpecs = require('./specs-valid.json'),
    invalidSpecs = require('./specs-invalid.json');

var validator = new ajv({
    allErrors: true,
    verbose: true,
    extendRefs: 'fail'
  })
  .addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

var validate = validator.compile(schema);

test('JSON schema is valid', function() {
  expect(validator.validateSchema(schema)).toBe(true);
});

test('JSON schema recognizes valid specifications', function() {
  var dir = __dirname + '/specs-valid/';
  validSpecs.forEach(function(file) {
    var spec = JSON.parse(fs.readFileSync(dir + file + '.vg.json')),
        valid = validate(spec);
    if (!valid) console.log(validate.errors); // eslint-disable-line no-console
    expect(valid).toBe(true);
  });
});

test('JSON schema recognizes invalid specifications', function() {
  var dir = __dirname + '/specs-invalid/';
  invalidSpecs.forEach(function(file) {
    var specs = JSON.parse(fs.readFileSync(dir + file + '.json'));
    specs.forEach(function(spec) {
      expect(validate(spec)).toBe(false);
    });
  });
});
