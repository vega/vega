var test = require('./util'),
    tape = require('tape');

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
