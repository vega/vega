var test = require('./util'),
    tape = require('tape');

tape('vg2pdf generates PDF output', t => {
  const cmd = './bin/vg2pdf --test test/resources/bar.vg.json';
  test(t, cmd, 'vg2pdf-test.pdf');
});

tape('vg2pdf generates scaled PDF output', t => {
  const cmd = './bin/vg2pdf --test --scale 2 test/resources/bar.vg.json';
  test(t, cmd, 'vg2pdf-test-scaled.pdf');
});
