const {exec} = require('child_process'),
      PNG = require('pngjs').PNG,
      pixelmatch = require('pixelmatch'),
      {readFileSync} = require('fs'),
      rimraf = require('rimraf'),
      res = 'test/resources/';

const GENERATE = false;

module.exports = function test(t, cmd, file, png=false) {
  const output = GENERATE ? res + file : file;

  exec(`${cmd} ${output}`, error => {
    if (error) t.fail(error);

    if (!GENERATE) {
      const expectImg = readFileSync(res + file);
      const actualImg = readFileSync(output);

      if (png) {
        const expect = PNG.sync.read(expectImg);
        const actual = PNG.sync.read(actualImg);
        const {width, height} = expect;
        t.equal(pixelmatch(actual.data, expect.data, null, width, height, {threshold: 0}), 0);
      } else {
        t.ok(expectImg.equals(actualImg));
      }
      rimraf(output, error => error ? t.fail(error) : null);
    }

    t.end();
  });
};
