import tape from 'tape';
import {textMetrics} from '../index.js';
import {textValue} from '../src/util/text.js';

const estimate = textMetrics.estimateWidth;

tape('estimateWidth should use per-character widths', t => {
  // 'Sales' at 10px: 667 + 556 + 222 + 556 + 500 thousandths of an em
  t.equal(estimate({fontSize: 10}, 'Sales'), 25.01);
  t.ok(estimate({fontSize: 10}, 'iiii') < estimate({fontSize: 10}, 'MMMM'));
  t.end();
});

tape('estimateWidth should scale with font size', t => {
  t.equal(estimate({fontSize: 20}, 'abc'), 2 * estimate({fontSize: 10}, 'abc'));
  // default font size is 11px
  t.ok(Math.abs(estimate({}, 'abc') - 1.1 * estimate({fontSize: 10}, 'abc')) < 1e-9);
  t.end();
});

tape('estimateWidth should widen bold text', t => {
  const regular = estimate({fontSize: 10}, 'abc');
  t.ok(Math.abs(estimate({fontSize: 10, fontWeight: 'bold'}, 'abc') - 1.1 * regular) < 1e-9);
  t.ok(Math.abs(estimate({fontSize: 10, fontWeight: 700}, 'abc') - 1.1 * regular) < 1e-9);
  t.equal(estimate({fontSize: 10, fontWeight: 400}, 'abc'), regular);
  t.end();
});

tape('estimateWidth should count wide and joined characters once', t => {
  t.equal(estimate({fontSize: 10}, '東京'), 20);
  t.equal(estimate({fontSize: 10}, '\u{1F680}'), 12.5);
  // family emoji: three people joined by ZWJ
  t.equal(estimate({fontSize: 10}, '\u{1F468}‍\u{1F469}‍\u{1F467}'), 12.5);
  // 'e' followed by a combining acute accent
  t.equal(estimate({fontSize: 10}, 'é'), estimate({fontSize: 10}, 'e'));
  t.end();
});

tape('truncation should fit the ellipsis and keep emoji whole', t => {
  textMetrics.canvas(false);
  // the ellipsis is 1em wide in Arial
  t.equal(estimate({fontSize: 10}, '…'), 10);
  t.equal(textValue({fontSize: 11, limit: 50}, '01234567890123456789'), '012345…');
  const rockets = '\u{1F680}'.repeat(5);
  t.equal(textValue({fontSize: 11, limit: 34}, rockets), '\u{1F680}…');
  t.equal(textValue({fontSize: 11, limit: 34, dir: 'rtl'}, rockets), '…\u{1F680}');
  // a lone low surrogate is not part of a pair
  t.equal(textValue({fontSize: 11, limit: 12}, '\u{1F680}abc'.slice(1)), '…');
  textMetrics.canvas(true);
  t.end();
});

tape('estimateWidth should measure truncated text', t => {
  const w = estimate({fontSize: 10, limit: 40}, 'a much longer axis label');
  t.ok(w > 30 && w <= 40);
  t.end();
});
