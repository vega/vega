import tape from 'tape';
import {Bounds, Marks, textMetrics, textProcessor, textProcessorPending, textProcessorWarnings} from '../index.js';
import './__init__.js';

const text = Marks.text;

// the 'test' processor is registered in __init__.js:
// width = 0.6em per character, ascent = 0.8em, descent = 0.2em

function bound(item) {
  return text.bound(new Bounds(), item);
}

function box(item) {
  const b = bound(item);
  return [b.x1, b.y1, b.x2, b.y2].map(v => Math.round(v * 1e6) / 1e6);
}

function counter(name, size = 1) {
  const calls = {count: 0};
  textProcessor(name, t => (++calls.count, {
    svg: `<svg viewBox="0 -800 ${600 * size * t.length} 1000"></svg>`,
    width: 0.6 * size * t.length,
    ascent: 0.8 * size,
    descent: 0.2 * size
  }));
  return calls;
}

tape('textProcessor should get, set and remove processors', t => {
  const fn = () => null;
  t.equal(textProcessor('tp-get'), undefined);
  t.equal(textProcessor('tp-get', fn), fn);
  t.equal(textProcessor('tp-get'), fn);
  textProcessor('tp-get', null);
  t.equal(textProcessor('tp-get'), undefined);
  t.end();
});

tape('textProcessor should reserve the default name', t => {
  t.throws(() => textProcessor('default', () => null), /reserved/);
  t.throws(() => textProcessor('tp-bad', 'not a function'), /must be a function/);
  t.end();
});

tape('Processed text bounds should use processor metrics', t => {
  // 4 characters at 10px: 24 x 10, ascent 8, descent 2
  const item = {x: 10, y: 20, text: 'abcd', fontSize: 10, textProcessor: 'test'};
  t.deepEqual(box(item), [10, 12, 34, 22], 'alphabetic baseline by default');
  t.end();
});

tape('Processed text bounds should support alignment and baselines', t => {
  const base = {x: 100, y: 100, text: 'abcd', fontSize: 10, textProcessor: 'test'};
  const aligns = {left: 100, center: 88, right: 76};
  const baselines = {
    'top': 100, 'line-top': 100, 'middle': 95,
    'bottom': 90, 'line-bottom': 90, 'alphabetic': 92
  };

  for (const align in aligns) {
    for (const baseline in baselines) {
      const x = aligns[align], y = baselines[baseline];
      t.deepEqual(
        box({...base, align, baseline}),
        [x, y, x + 24, y + 10],
        `${align} ${baseline}`
      );
    }
  }
  t.end();
});

tape('Processed text bounds should support offsets, polar and angles', t => {
  const base = {text: 'abcd', fontSize: 10, textProcessor: 'test', baseline: 'top'};

  t.deepEqual(box({...base, x: 10, y: 10, dx: 5, dy: -5}), [15, 5, 39, 15], 'dx/dy');

  // radius 10 at theta 0 points north (up)
  t.deepEqual(box({...base, x: 50, y: 50, radius: 10, theta: 0}), [50, 40, 74, 50], 'radius/theta');

  // rotating 90 degrees about the anchor point maps [0,24] x [0,10] to [-10,0] x [0,24]
  t.deepEqual(box({...base, x: 0, y: 0, angle: 90}), [-10, 0, 0, 24], 'angle');

  // mode 1 returns unrotated bounds, used for hit testing
  const b = text.bound(new Bounds(), {...base, x: 0, y: 0, angle: 90}, 1);
  t.deepEqual([b.x1, b.y1, b.x2, b.y2], [0, 0, 24, 10], 'unrotated bounds');
  t.end();
});

tape('textMetrics.size should account for text processors', t => {
  const item = {text: 'abcd', fontSize: 10};
  t.deepEqual(textMetrics.size({...item, textProcessor: 'test'}), {width: 24, height: 10});

  const plain = textMetrics.size(item);
  t.equal(plain.width, textMetrics.width(item, item.text));
  t.equal(plain.height, 10);
  t.end();
});

tape('Default, empty and missing processor values should use standard text', t => {
  textProcessorWarnings(); // clear
  const item = {x: 10, y: 20, text: 'abcd', fontSize: 10};
  const plain = box(item);

  t.deepEqual(box({...item, textProcessor: 'default'}), plain, 'default');
  t.deepEqual(box({...item, textProcessor: ''}), plain, 'empty string');
  t.deepEqual(box({...item, textProcessor: null}), plain, 'null');
  t.equal(text.itemTag({...item, textProcessor: 'default'}), 'text');
  t.equal(text.itemContent({...item, textProcessor: 'default'}), null);
  t.deepEqual(textProcessorWarnings(), []);
  t.end();
});

tape('Unrecognized processors should use standard text and warn once', t => {
  textProcessorWarnings(); // clear
  const item = {x: 10, y: 20, text: 'abcd', fontSize: 10};
  const plain = box(item);

  t.deepEqual(box({...item, textProcessor: 'tp-unknown'}), plain);
  t.deepEqual(box({...item, textProcessor: 'tp-unknown', text: 'other'}), box({...item, text: 'other'}));
  t.deepEqual(textProcessorWarnings(), ['Unrecognized text processor: "tp-unknown".']);
  t.deepEqual(textProcessorWarnings(), [], 'warnings are cleared');

  t.deepEqual(box({...item, textProcessor: 7}), plain, 'non-string value');
  t.deepEqual(textProcessorWarnings(), ['Invalid text processor: 7.']);
  t.end();
});

tape('Processors registered later should take effect', t => {
  textProcessorWarnings(); // clear
  const item = {x: 10, y: 20, text: 'abcd', fontSize: 10, textProcessor: 'tp-late'};
  const plain = box({...item, textProcessor: null});

  t.deepEqual(box(item), plain);
  counter('tp-late');
  t.deepEqual(box(item), [10, 12, 34, 22]);
  textProcessor('tp-late', null);
  textProcessorWarnings(); // clear
  t.end();
});

tape('Failed processing should use standard text and warn', t => {
  textProcessorWarnings(); // clear
  const item = {x: 10, y: 20, text: 'fail', fontSize: 10};
  textProcessor('tp-null', () => null);
  t.deepEqual(box({...item, textProcessor: 'tp-null'}), box(item), 'null output');
  t.deepEqual(textProcessorWarnings(), ['Text processor "tp-null" could not process "fail".']);

  textProcessor('tp-throw', () => { throw new Error('Bad input'); });
  t.deepEqual(box({...item, textProcessor: 'tp-throw'}), box(item), 'thrown error');
  t.deepEqual(textProcessorWarnings(), ['Text processor "tp-throw" failed for "fail": Bad input']);

  textProcessor('tp-invalid', () => ({svg: 'not svg', width: 1, ascent: 1, descent: 0}));
  t.deepEqual(box({...item, textProcessor: 'tp-invalid'}), box(item), 'invalid output');
  t.deepEqual(textProcessorWarnings(), ['Text processor "tp-invalid" returned invalid output for "fail".']);

  // failures are cached, so warnings are not repeated
  box({...item, textProcessor: 'tp-throw'});
  t.deepEqual(textProcessorWarnings(), []);
  t.end();
});

tape('Processed output should be cached by text and re-registration', t => {
  const calls = counter('tp-cache');
  const item = {x: 0, y: 0, fontSize: 10, textProcessor: 'tp-cache'};

  box({...item, text: 'abc'});
  box({...item, text: 'abc'});
  box({...item, text: 'abc', fontSize: 20}); // cached in em units
  t.equal(calls.count, 1);

  box({...item, text: 'xyz'});
  t.equal(calls.count, 2);

  // re-registration invalidates cached output
  const calls2 = counter('tp-cache', 2);
  t.deepEqual(box({...item, text: 'abc', baseline: 'top'}), [0, 0, 36, 20]);
  t.equal(calls2.count, 1);
  textProcessor('tp-cache', null);
  t.end();
});

tape('Processed text should join array-valued text', t => {
  const item = {x: 0, y: 0, fontSize: 10, textProcessor: 'test', baseline: 'top'};
  // 'a b' has 3 characters
  t.deepEqual(box({...item, text: ['a', 'b']}), [0, 0, 18, 10]);
  t.end();
});

tape('Processed text should provide SVG element content', t => {
  const item = {x: 0, y: 0, text: 'abcd', fontSize: 10, textProcessor: 'test', fill: 'red'};
  t.equal(text.itemTag(item), 'g');

  const [image, select] = text.itemContent(item);
  t.equal(image.tag, 'image');
  t.equal(image.attrs.width, 24);
  t.equal(image.attrs.height, 10);
  t.equal(image.attrs.y, -8);

  const svg = atob(image.attrs['xlink:href'].split(',')[1]);
  t.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="10" color="red"'),
    'sets size and color on the root element');
  t.notOk(/1ex/.test(svg), 'removes processor size attributes');

  t.equal(select.tag, 'text');
  t.equal(select.text, 'abcd');
  t.equal(select.attrs.textLength, 24);
  t.equal(select.attrs['fill-opacity'], 0);
  t.equal(select.attrs['aria-hidden'], true);

  t.equal(text.itemContent({...item, textSelectable: false}).length, 1, 'textSelectable false');
  t.equal(text.itemContent({...item, text: 'copy'})[1].text, 'copied', 'copyText');
  t.equal(text.itemContent({...item, fill: null}).length, 1, 'no image without color');
  t.end();
});

tape('Pending processors should use standard text until resources load', async t => {
  textProcessorWarnings(); // clear
  textProcessorPending(); // clear
  let loaded = false, resolve;
  const promise = new Promise(r => resolve = r);
  textProcessor('tp-pending', text => loaded
    ? {svg: '<svg viewBox="0 -800 1000 1000"></svg>', width: text.length, ascent: 0.8, descent: 0.2}
    : promise);

  const item = {x: 0, y: 0, text: 'ab', fontSize: 10, textProcessor: 'tp-pending', baseline: 'top'};
  const plain = box({...item, textProcessor: null});
  t.deepEqual(box(item), plain, 'standard text while pending');
  t.deepEqual(textProcessorPending(), [promise], 'promise is queued');
  t.deepEqual(textProcessorPending(), [], 'queue is cleared');
  t.deepEqual(textProcessorWarnings(), [], 'no warning');

  loaded = true;
  resolve();
  await promise;
  t.deepEqual(box(item), [0, 0, 20, 10], 'processed once loaded');
  textProcessor('tp-pending', null);
  t.end();
});

tape('Pending processors should be retried a limited number of times', t => {
  textProcessorWarnings(); // clear
  textProcessorPending(); // clear
  let calls = 0;
  textProcessor('tp-forever', () => (++calls, Promise.resolve()));
  const item = {x: 0, y: 0, text: 'ab', fontSize: 10, textProcessor: 'tp-forever'};
  for (let i = 0; i < 10; ++i) box(item);
  t.equal(calls, 6, 'stops after the retry limit');
  t.equal(textProcessorPending().length, 5);
  t.deepEqual(textProcessorWarnings(), ['Text processor "tp-forever" did not complete for "ab".']);
  textProcessor('tp-forever', null);
  t.end();
});
