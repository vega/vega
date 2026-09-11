import tape from 'tape';
import jsdom from 'jsdom';
import {
  CanvasRenderer,
  resetSVGDefIds,
  sceneFromJSON,
  sceneToJSON,
  //eslint-disable-next-line sort-imports
  SVGRenderer,
  SVGStringRenderer as StringRenderer
} from '../index.js';

const doc = (new jsdom.JSDOM()).window.document;

tape('text mark supports textDecoration in item', t => {
  const scene = {
    marktype: 'text',
    items: [{
      text: 'Test',
      x: 0,
      y: 0,
      textDecoration: 'underline',
      fill: '#000',
      font: 'Arial'
    }]
  };

  sceneFromJSON(scene);
  t.equal(scene.items[0].textDecoration, 'underline');

  const json = sceneToJSON(scene);
  const parsed = JSON.parse(json);
  t.equal(parsed.items[0].textDecoration, 'underline');

  t.end();
});

tape('text mark preserves textDecoration in serialization round-trip', t => {
  const scene = {
    marktype: 'text',
    items: [{
      text: 'Underlined',
      x: 10,
      y: 20,
      textDecoration: 'underline',
      fill: 'black',
      font: 'Arial'
    }]
  };

  const restored = sceneFromJSON(JSON.parse(sceneToJSON(scene)));
  t.equal(restored.items[0].textDecoration, 'underline');

  t.end();
});

tape('CanvasRenderer renders text mark with textDecoration', t => {
  const scene = {
    marktype: 'text',
    items: [{
      text: 'Test',
      x: 0,
      y: 50,
      textDecoration: 'underline',
      fill: '#000',
      font: 'Arial',
      fontSize: 12
    }]
  };

  sceneFromJSON(scene);

  const r = new CanvasRenderer()
    .initialize(null, 200, 100)
    .background('white');

  t.doesNotThrow(() => r.render(scene));
  const buffer = r.canvas().toBuffer();
  t.ok(buffer && buffer.length > 0);

  t.end();
});

tape('SVGRenderer renders text-decoration attribute', t => {
  const scene = {
    marktype: 'text',
    items: [{
      text: 'Test',
      x: 0,
      y: 50,
      textDecoration: 'underline',
      fill: '#000',
      font: 'Arial',
      fontSize: 12
    }]
  };

  sceneFromJSON(scene);
  resetSVGDefIds();

  const r = new SVGRenderer()
    .initialize(doc.body, 200, 100)
    .render(scene);

  const svg = r.svg();
  t.ok(svg.includes('text-decoration') || svg.includes('text-decoration="underline"'),
    'SVG output should contain text-decoration attribute');

  t.end();
});

tape('SVGStringRenderer renders text-decoration in output', t => {
  const scene = {
    marktype: 'text',
    items: [{
      text: 'Test',
      x: 0,
      y: 50,
      textDecoration: 'underline',
      fill: '#000',
      font: 'Arial',
      fontSize: 12
    }]
  };

  sceneFromJSON(scene);
  resetSVGDefIds();

  const r = new StringRenderer()
    .initialize(null, 200, 100)
    .render(scene);

  const svg = r.svg();
  t.ok(svg.includes('text-decoration') && svg.includes('underline'),
    'SVG string output should contain text-decoration with underline');

  t.end();
});
