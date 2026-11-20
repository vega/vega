import tape from 'tape';
import {parse} from '../../vega-parser/index.js';
import {ariaLocale, resetAriaLocale} from 'vega-scenegraph';
import {View} from '../index.js';

tape('View applies aria locale precedence and snapshots global defaults', t => {
  ariaLocale({
    languageTag: 'es',
    'role.axis': 'global axis',
    'role.legend': 'global legend'
  });

  const runtime = parse({}, {
    ariaLocale: {
      'role.axis': 'config axis'
    }
  });
  const view = new View(runtime, {
    ariaLocale: {
      'role.legend': 'view legend'
    },
    renderer: 'none'
  });

  t.equal(runtime.ariaLocale['role.axis'], 'config axis', 'parser includes config locale');
  t.equal(view.ariaLocale().languageTag, 'es', 'inherits global locale');
  t.equal(view.ariaLocale()['role.axis'], 'config axis', 'config overrides global locale');
  t.equal(view.ariaLocale()['role.legend'], 'view legend', 'view option overrides global locale');

  ariaLocale({'role.axis': 'new global axis'});
  t.equal(view.ariaLocale()['role.axis'], 'config axis', 'existing view retains its locale snapshot');

  view.ariaLocale({'role.legend': 'updated legend'});
  t.equal(view.ariaLocale().languageTag, 'es', 'setter retains global snapshot');
  t.equal(view.ariaLocale()['role.axis'], 'config axis', 'setter retains config locale');
  t.equal(view.ariaLocale()['role.legend'], 'updated legend', 'setter applies view override');

  resetAriaLocale();
  t.end();
});
