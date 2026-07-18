import test from './util.js';
import tape from 'tape';

tape('vg2png generates PNG output', t => {
  const cmd = './bin/vg2png test/resources/bar.vg.json';
  test(t, cmd, 'vg2png-test.png', true);
});

tape('vg2png generates scaled PNG output', t => {
  const cmd = './bin/vg2png --scale 2 test/resources/bar.vg.json';
  test(t, cmd, 'vg2png-test-scaled.png', true);
});
