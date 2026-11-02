import test from './util.js';
import tape from 'tape';
import { exec } from 'child_process';

tape('vg2svg generates SVG output', t => {
  const cmd = './bin/vg2svg test/resources/bar.vg.json';
  test(t, cmd, 'vg2svg-test.svg');
});

tape('vg2svg generates SVG output with header', t => {
  const cmd = './bin/vg2svg -h test/resources/bar.vg.json';
  test(t, cmd, 'vg2svg-test-header.svg');
});

tape('vg2svg generates scaled SVG output', t => {
  const cmd = './bin/vg2svg --scale 2 test/resources/bar.vg.json';
  test(t, cmd, 'vg2svg-test-scaled.svg');
});

tape('vg2svg applies a config file', t => {
  const cmd = './bin/vg2svg --config test/resources/config.json test/resources/bar.vg.json';
  test(t, cmd, 'vg2svg-test-config.svg');
});

tape('vg2svg errors on a missing config file', t => {
  const cmd = './bin/vg2svg --config test/resources/does-not-exist.json test/resources/bar.vg.json';
  exec(cmd, (error, stdout, stderr) => {
    t.ok(error, 'exits with a non-zero code');
    t.ok(stderr.includes('Could not load --config file'), 'reports the config file');
    t.end();
  });
});

tape('vg2svg errors on an invalid config file', t => {
  const cmd = './bin/vg2svg --config test/resources/config-invalid.json test/resources/bar.vg.json';
  exec(cmd, (error, stdout, stderr) => {
    t.ok(error, 'exits with a non-zero code');
    t.ok(stderr.includes('Could not load --config file'), 'reports the config file');
    t.end();
  });
});

tape('vg2svg keeps the locale from the spec config', t => {
  const cmd = './bin/vg2svg test/resources/bar-locale.vg.json';
  exec(cmd, (error, stdout) => {
    t.error(error, 'exits with a zero code');
    t.ok(stdout.includes('>20.000<'), 'uses the number locale from config.locale');
    t.notOk(stdout.includes('>20,000<'), 'does not fall back to the default locale');
    t.end();
  });
});

tape('vg2svg lets --format override the locale from the spec config', t => {
  const cmd = './bin/vg2svg --format test/resources/number-locale.json test/resources/bar-locale.vg.json';
  exec(cmd, (error, stdout) => {
    t.error(error, 'exits with a zero code');
    t.ok(stdout.includes("20'000"), 'uses the number locale from --format');
    t.end();
  });
});
