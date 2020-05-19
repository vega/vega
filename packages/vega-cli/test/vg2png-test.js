var test = require('./util'),
    tape = require('tape');

tape('vg2png generates PNG output', function(t) {
  const cmd = './bin/vg2png test/resources/bar.vg.json';
  test(t, cmd, 'vg2png-test.png');
});

tape('vg2png generates scaled PNG output', function(t) {
  const cmd = './bin/vg2png --scale 2 test/resources/bar.vg.json';
  test(t, cmd, 'vg2png-test-scaled.png');
});
