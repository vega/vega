import tape from 'tape';
import {JSDOM} from 'jsdom';
import {View} from '../index.js';
import {parse} from '../../vega-parser/index.js';

tape('View ignores event handler form binding properties', t => {
  const dom = new JSDOM('<div id="view"></div>'),
        doc = dom.window.document,
        warnings = [],
        view = new View(parse({
          signals: [{
            name: 'x',
            value: 0,
            bind: {
              input: 'text',
              autocomplete: 'off',
              placeholder: 'Search',
              custom: 'kept',
              oncustom: 'ignored'
            }
          }]
        }), {
          renderer: 'none',
          logger: {
            warn: message => warnings.push(message)
          }
        });

  global.document = doc;
  view.initialize(doc.querySelector('#view'));
  delete global.document;

  const input = doc.querySelector('input');
  t.equal(input.getAttribute('type'), 'text');
  t.equal(input.getAttribute('name'), 'x');
  t.equal(input.getAttribute('autocomplete'), 'off');
  t.equal(input.getAttribute('placeholder'), 'Search');
  t.equal(input.getAttribute('custom'), 'kept');
  t.equal(input.hasAttribute('oncustom'), false);
  t.deepEqual(warnings, [
    'Ignoring unsupported signal binding property "oncustom" for signal "x".'
  ]);

  view.finalize();
  t.end();
});
