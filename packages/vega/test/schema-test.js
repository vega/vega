import tape from 'tape';
import * as ajv from 'ajv';
import fs from 'fs';
import schema from '../build/vega-schema.json' with { type: 'json' };
import validSpecs from './specs-valid.json' with { type: 'json' };
import invalidSpecs from './specs-invalid.json' with { type: 'json' };
import addFormats from 'ajv-formats';

const validator = new ajv.default({
    allErrors: true,
    verbose: true
  });

addFormats(validator);

const validate = validator.compile(schema);

tape('JSON schema is valid', t => {
  t.ok(validator.validateSchema(schema));
  t.end();
});

tape('JSON schema recognizes valid specifications', t => {
  const dir = process.cwd() + '/test/specs-valid/';
  validSpecs.forEach(file => {
    var spec = JSON.parse(fs.readFileSync(dir + file + '.vg.json')),
        valid = validate(spec);
    t.ok(valid, 'valid schema: ' + file);
    if (!valid) console.log(validate.errors); // eslint-disable-line no-console
  });

  t.end();
});

tape('JSON schema recognizes invalid specifications', t => {
  const dir = process.cwd() + '/test/specs-invalid/';
  invalidSpecs.forEach(file => {
    const specs = JSON.parse(fs.readFileSync(dir + file + '.json'));
    specs.forEach((spec, index) => {
      t.notOk(validate(spec),
        'invalid schema (' + index + '): ' + file);
    });
  });

  t.end();
});
