import tape from 'tape';
import {canvas} from 'vega-canvas';
import color from '../src/util/canvas/color.js';
import {Bounds, CanvasRenderer, sceneFromJSON} from '../index.js';

const linear = {
  gradient: 'linear', x1: 0, y1: 0, x2: 1, y2: 1,
  stops: [{offset: 0, color: 'red'}, {offset: 1, color: 'blue'}]
};

function render(x, y, paint, options = {}) {
  const mark = options.path ? {
    marktype: 'path',
    items: [{x, y, angle: 90, path: 'M0,0h80v40h-80Z', fill: paint}]
  } : options.symbol ? {
    marktype: 'symbol',
    items: [{x, y, angle: 30, shape: 'triangle-up', size: 2400, fill: paint}]
  } : options.area ? {
    marktype: 'area',
    items: [{x, y, height: 40, fill: paint}, {x: x + 80, y, height: 40, fill: paint}]
  } : {
    marktype: 'rect',
    items: [{x, y, width: options.width || 80, height: 40,
      ...(options.stroke ? {stroke: paint, strokeWidth: 8} : {fill: paint})}]
  };
  const scene = sceneFromJSON({
    marktype: 'group',
    items: [{x: options.groupX || 0, y: options.groupY || 0, items: [mark]}]
  });
  if (options.area) mark.items[0].bounds = mark.bounds;
  return new CanvasRenderer()
    .initialize(null, 240, 180, options.origin || [0, 0], options.scale || 1)
    .render(scene).canvas().getContext('2d');
}

function samples(context, x, y, scale = 1) {
  return [[10, 10], [20, 20], [30, 30]].map(([dx, dy]) =>
    Array.from(context.getImageData(scale * (x + dx), scale * (y + dy), 1, 1).data)
  );
}

tape('CanvasRenderer should position diagonal gradients at the item bounds', t => {
  const expected = samples(render(0, 0, linear), 0, 0);
  t.ok(expected.every(pixel => pixel[3] === 255));
  t.notDeepEqual(expected[0], expected[2]);
  t.deepEqual(samples(render(120, 80, linear), 120, 80), expected);
  t.end();
});

tape('CanvasRenderer should position diagonal gradients with negative bounds', t => {
  const expected = samples(render(0, 0, linear), 0, 0);
  const context = render(-120, -80, linear, {origin: [140, 100]});
  t.deepEqual(samples(context, 20, 20), expected);
  t.end();
});

tape('CanvasRenderer should position diagonal gradients within translated groups', t => {
  const expected = samples(render(0, 0, linear), 0, 0);
  const context = render(120, 80, linear, {groupX: 20, groupY: 30});
  t.deepEqual(samples(context, 140, 110), expected);
  t.end();
});

tape('CanvasRenderer should position diagonal gradients with fractional bounds', t => {
  const expected = samples(render(0.5, 0.25, linear, {width: 80.5}), 0, 0);
  const context = render(120.5, 80.25, linear, {width: 80.5});
  t.deepEqual(samples(context, 120, 80), expected);
  t.end();
});

tape('CanvasRenderer should position diagonal gradients at higher resolution', t => {
  const expected = samples(render(0, 0, linear, {scale: 2}), 0, 0, 2);
  const context = render(120, 80, linear, {scale: 2});
  t.deepEqual(samples(context, 120, 80, 2), expected);
  t.end();
});

tape('CanvasRenderer should retain native gradient positioning', t => {
  const gradients = [
    {...linear, y2: 0},
    {...linear, x2: 0},
    {gradient: 'radial', stops: linear.stops}
  ];
  for (const paint of gradients) {
    const expected = samples(render(0, 0, paint), 0, 0);
    t.ok(expected.every(pixel => pixel[3] === 255));
    t.deepEqual(samples(render(120, 80, paint), 120, 80), expected);
  }
  const expected = samples(render(0, 0, linear, {width: 40}), 0, 0);
  t.deepEqual(samples(render(120, 80, linear, {width: 40}), 120, 80), expected);
  t.end();
});

tape('CanvasRenderer should position diagonal area gradients at the item bounds', t => {
  const expected = samples(render(0, 0, linear, {area: true}), 0, 0);
  t.ok(expected.every(pixel => pixel[3] === 255));
  t.notDeepEqual(expected[0], expected[2]);
  t.deepEqual(samples(render(120, 80, linear, {area: true}), 120, 80), expected);
  t.end();
});

tape('CanvasRenderer should position diagonal stroke gradients at the item bounds', t => {
  const pixels = (context, x, y) => [10, 40, 70].map(dx =>
    Array.from(context.getImageData(x + dx, y, 1, 1).data)
  );
  const expected = pixels(render(0, 0, linear, {stroke: true}), 0, 0);
  t.ok(expected.every(pixel => pixel[3] === 255));
  t.notDeepEqual(expected[0], expected[2]);
  t.deepEqual(pixels(render(120, 80, linear, {stroke: true}), 120, 80), expected);
  t.end();
});

tape('Canvas colors should preserve rotated gradient coordinate frames', t => {
  const draw = (x, y, mark) => {
    const context = canvas(240, 180).getContext('2d');
    context.translate(120, 80);
    context.rotate(Math.PI / 6);
    context.fillStyle = color(context, {
      mark, angle: 30,
      bounds: new Bounds().set(x, y, x + 80, y + 40)
    }, linear);
    context.fillRect(0, 0, 80, 40);
    return context.getImageData(0, 0, 240, 180).data;
  };
  const expected = draw(0, 0, {marktype: 'text'});
  t.ok(expected.some((value, i) => i % 4 === 3 && value > 0));
  for (const mark of [{marktype: 'text'}, {marktype: 'path'}, undefined]) {
    t.deepEqual(draw(120, 80, mark), expected);
  }
  t.end();
});

tape('CanvasRenderer should position diagonal gradients on rotated symbols', t => {
  const pixels = (context, x, y) => [-10, -5, 0].map(dy =>
    Array.from(context.getImageData(x, y + dy, 1, 1).data)
  );
  const expected = pixels(render(40, 40, linear, {symbol: true}), 40, 40);
  t.ok(expected.every(pixel => pixel[3] === 255));
  t.notDeepEqual(expected[0], expected[2]);
  t.deepEqual(pixels(render(120, 80, linear, {symbol: true}), 120, 80), expected);
  t.end();
});

tape('CanvasRenderer should retain visible diagonal gradients on rotated paths', t => {
  const context = render(40, 20, linear, {path: true, origin: [80, 80]});
  const pixels = [120, 140].map(y =>
    Array.from(context.getImageData(100, y, 1, 1).data)
  );
  t.ok(pixels.every(pixel => pixel[3] === 255));
  t.notDeepEqual(pixels[0], pixels[1]);
  t.end();
});
