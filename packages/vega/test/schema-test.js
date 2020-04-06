const tape = require('tape');
const vega = require('../'); // eslint-disable-line no-unused-vars
const ajv = require('ajv');
const fs = require('fs');
const schema = require('../build/vega-schema.json');
const validSpecs = require('./specs-valid.json');
const invalidSpecs = require('./specs-invalid.json');

const validator = new ajv({
  allErrors: true,
  verbose: true,
  extendRefs: 'fail'
}).addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

const validate = validator.compile(schema);

tape('JSON schema is valid', function (t) {
  t.ok(validator.validateSchema(schema));
  t.end();
});

tape('JSON schema recognizes valid specifications', function (t) {
  const dir = process.cwd() + '/test/specs-valid/';
  validSpecs.forEach(function (file) {
    const spec = JSON.parse(fs.readFileSync(dir + file + '.vg.json'));
    const valid = validate(spec);
    t.ok(valid, 'valid schema: ' + file);
    if (!valid) console.log(validate.errors); // eslint-disable-line no-console
  });

  t.end();
});

tape('JSON schema recognizes invalid specifications', function (t) {
  const dir = process.cwd() + '/test/specs-invalid/';
  invalidSpecs.forEach(function (file) {
    const specs = JSON.parse(fs.readFileSync(dir + file + '.json'));
    specs.forEach(function (spec, index) {
      t.notOk(validate(spec), 'invalid schema (' + index + '): ' + file);
    });
  });

  t.end();
});
