import tape from 'tape';
import {domainCaption} from '../src/caption.js';
import {DEFAULT_ARIA_LOCALE, formatString, selectPluralKey} from '../../vega-scenegraph/src/util/aria-locale.js';

// Minimal locale mock (returns identity format for simplicity)
const mockLocale = null;
const identityFmt = x => String(x);

function mockScale(type, domain) {
  const s = () => {};
  s.type = type;
  s.domain = () => domain;
  return s;
}

tape('domainCaption backward compat: no ariaLoc', t => {
  const scale = mockScale('band', ['a', 'b', 'c']);
  const result = domainCaption(mockLocale, scale, {});
  t.equal(result, '3 values: a, b, c');
  t.end();
});

tape('domainCaption backward compat: singular value', t => {
  const scale = mockScale('band', ['x']);
  const result = domainCaption(mockLocale, scale, {});
  t.equal(result, '1 value: x');
  t.end();
});

tape('domainCaption backward compat: continuous', t => {
  const scale = mockScale('linear', [0, 100]);
  scale.domain = () => [0, 100];
  const result = domainCaption(mockLocale, scale, {});
  t.equal(result, 'values from 0 to 100');
  t.end();
});

tape('domainCaption with aria locale: discrete', t => {
  const scale = mockScale('band', ['a', 'b', 'c']);
  const loc = DEFAULT_ARIA_LOCALE;
  const result = domainCaption(mockLocale, scale, {}, loc, formatString, selectPluralKey);
  t.equal(result, '3 values: a, b, c');
  t.end();
});

tape('domainCaption with aria locale: singular', t => {
  const scale = mockScale('band', ['x']);
  const loc = DEFAULT_ARIA_LOCALE;
  const result = domainCaption(mockLocale, scale, {}, loc, formatString, selectPluralKey);
  t.equal(result, '1 value: x');
  t.end();
});

tape('domainCaption with aria locale: continuous', t => {
  const scale = mockScale('linear', [0, 100]);
  const loc = DEFAULT_ARIA_LOCALE;
  const result = domainCaption(mockLocale, scale, {}, loc, formatString, selectPluralKey);
  t.equal(result, 'values from 0 to 100');
  t.end();
});

tape('domainCaption with custom locale: Spanish', t => {
  const scale = mockScale('band', ['a', 'b', 'c']);
  const esLocale = {
    ...DEFAULT_ARIA_LOCALE,
    'domainValues_one': '{0} valor: {1}',
    'domainValues_other': '{0} valores: {1}',
    'listJoiner': ', ',
    'languageTag': 'es'
  };
  const result = domainCaption(mockLocale, scale, {}, esLocale, formatString, selectPluralKey);
  t.equal(result, '3 valores: a, b, c');
  t.end();
});

tape('domainCaption with custom list joiner', t => {
  const scale = mockScale('band', ['a', 'b', 'c']);
  const deLoc = {
    ...DEFAULT_ARIA_LOCALE,
    'listJoiner': '; ',
    'languageTag': 'de'
  };
  const result = domainCaption(mockLocale, scale, {}, deLoc, formatString, selectPluralKey);
  t.equal(result, '3 values: a; b; c');
  t.end();
});

tape('domainCaption with discrete overflow and custom locale', t => {
  const scale = mockScale('band', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
  const esLocale = {
    ...DEFAULT_ARIA_LOCALE,
    'domainValues_other': '{0} valores: {1}',
    'domainDiscreteOverflow': '{0}, terminando con {1}',
    'languageTag': 'es'
  };
  const result = domainCaption(mockLocale, scale, {}, esLocale, formatString, selectPluralKey);
  t.equal(result, '10 valores: a, b, c, d, e, terminando con j');
  t.end();
});

tape('domainCaption continuous with custom locale', t => {
  const scale = mockScale('linear', [0, 100]);
  const esLocale = {
    ...DEFAULT_ARIA_LOCALE,
    'domainContinuous': 'valores de {0} a {1}',
    'languageTag': 'es'
  };
  const result = domainCaption(mockLocale, scale, {}, esLocale, formatString, selectPluralKey);
  t.equal(result, 'valores de 0 a 100');
  t.end();
});
