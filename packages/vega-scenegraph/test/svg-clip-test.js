import tape from 'tape';
import svgClip, { resetSVGClipId } from '../src/util/svg/clip.js';

tape('svg clip should drop stale path when group loses corner radius (#4337)', t => {
  resetSVGClipId();
  const renderer = { _defs: { clipping: {} } };
  const item = { clip: true };

  // First render: rectangular clip, no corner radius.
  svgClip(renderer, item, { width: 200, height: 100 });
  const first = renderer._defs.clipping[item.clip_id];
  t.equal(first.width, 200, 'width set on first render');
  t.equal(first.height, 100, 'height set on first render');
  t.equal(first.path, undefined, 'no path on first render');

  // Second render: corner radius appears, clip becomes a rounded path.
  svgClip(renderer, item, { width: 200, height: 100, cornerRadius: 10 });
  t.ok(first.path, 'path set once corner radius is non-zero');
  t.equal(first.width, undefined, 'width cleared when path takes over');
  t.equal(first.height, undefined, 'height cleared when path takes over');

  // Third render: corner radius returns to zero (the bug trigger).
  svgClip(renderer, item, { width: 200, height: 100 });
  t.equal(first.path, undefined, 'stale path is dropped when corner radius resets');
  t.equal(first.width, 200, 'width restored after corner radius resets');
  t.equal(first.height, 100, 'height restored after corner radius resets');

  // Fourth render: width changes with no corner radius (the symptom trigger).
  svgClip(renderer, item, { width: 300, height: 100 });
  t.equal(first.path, undefined, 'no stale path after width change');
  t.equal(first.width, 300, 'width tracks current group width');
  t.equal(first.height, 100, 'height tracks current group height');

  t.end();
});

tape('svg clip should switch between function clip and rect clip', t => {
  resetSVGClipId();
  const renderer = { _defs: { clipping: {} } };
  const item = { clip: true };

  // Rectangular clip first.
  svgClip(renderer, item, { width: 100, height: 50 });
  const c = renderer._defs.clipping[item.clip_id];
  t.equal(c.width, 100);
  t.equal(c.path, undefined);

  // Switch to a function clip.
  item.clip = () => 'M0,0L50,50L100,0Z';
  svgClip(renderer, item, { width: 100, height: 50 });
  t.equal(c.path, 'M0,0L50,50L100,0Z', 'function clip writes path');
  t.equal(c.width, undefined, 'rect attrs cleared when switching to function clip');
  t.equal(c.height, undefined, 'rect attrs cleared when switching to function clip');

  // Switch back to rectangular.
  item.clip = true;
  svgClip(renderer, item, { width: 100, height: 50 });
  t.equal(c.path, undefined, 'stale function path dropped on switch back');
  t.equal(c.width, 100, 'width restored');
  t.equal(c.height, 50, 'height restored');

  t.end();
});
