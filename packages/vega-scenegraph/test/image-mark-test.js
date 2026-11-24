import tape from 'tape';
import {Marks} from '../index.js';

function scene(image) {
  return {
    marktype: 'image',
    items: [{x: 0, y: 0, width: 40, height: 40, url: 'x', image}]
  };
}

function context(calls) {
  return {
    drawImage(img) {
      if (!img.naturalWidth && !img.width) {
        throw new Error('InvalidStateError');
      }
      calls.push(img);
    }
  };
}

tape('Image mark canvas draw should skip broken images', t => {
  const calls = [];
  const img = {complete: true, width: 0, height: 0, naturalWidth: 0, url: 'x'};
  t.doesNotThrow(() => Marks.image.draw(context(calls), scene(img)));
  t.equal(calls.length, 0);
  t.end();
});

tape('Image mark canvas draw should draw loaded images', t => {
  const calls = [];
  const img = {complete: true, width: 20, height: 20, naturalWidth: 20, url: 'x'};
  Marks.image.draw(context(calls), scene(img));
  t.equal(calls.length, 1);
  t.equal(calls[0], img);
  t.end();
});
