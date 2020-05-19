const {exec} = require('child_process'),
      {readFileSync} = require('fs'),
      rimraf = require('rimraf');

const GENERATE = false;

const resource = file => 'test/resources/' + file;

module.exports = function test(t, cmd, file) {
  const output = GENERATE ? resource(file) : file;

  exec(`${cmd} ${output}`, error => {
    if (error) t.fail(error);

    if (!GENERATE) {
      const expect = readFileSync(resource(output));
      const actual = readFileSync(output);
      t.ok(actual.equals(expect));
      rimraf(output, error => error ? t.fail(error) : null);
    }

    t.end();
  });
};
