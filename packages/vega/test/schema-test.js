var tape = require('tape'),
    vega = require('../'), // eslint-disable-line no-unused-vars
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

tape('JSON schema is valid', function(t) {
  t.ok(validator.validateSchema(schema));
  t.end();
});

tape('JSON schema recognizes valid specifications', function(t) {
  var dir = process.cwd() + '/test/specs-valid/';
  validSpecs.forEach(function(file) {
    var spec = JSON.parse(fs.readFileSync(dir + file + '.vg.json')),
        valid = validate(spec);
    t.ok(valid, 'valid schema: ' + file);
    if (!valid) console.log(validate.errors); // eslint-disable-line no-console
  });

  t.end();
});

tape('JSON schema recognizes invalid specifications', function(t) {
  var dir = process.cwd() + '/test/specs-invalid/';
  invalidSpecs.forEach(function(file) {
    var specs = JSON.parse(fs.readFileSync(dir + file + '.json'));
    specs.forEach(function(spec, index) {
      t.notOk(validate(spec),
        'invalid schema (' + index + '): ' + file);
    });
  });

  t.end();
});
