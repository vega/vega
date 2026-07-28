import tape from 'tape';
import {DEFAULT_ARIA_LOCALE, formatString, selectPluralKey} from '../src/util/aria-locale.js';

tape('formatString replaces {N} placeholders', t => {
  t.equal(formatString('{0}-axis', 'X'), 'X-axis');
  t.equal(formatString('{0} mark', 'rect'), 'rect mark');
  t.equal(formatString('values from {0} to {1}', '0', '100'), 'values from 0 to 100');
  t.equal(formatString('{0} boundaries: {1}', 3, 'a, b, c'), '3 boundaries: a, b, c');
  t.end();
});

tape('formatString handles missing args and no placeholders', t => {
  t.equal(formatString('no placeholders'), 'no placeholders');
  t.equal(formatString('{0} {2}', 'a'), 'a {2}', 'unreplaced placeholder preserved');
  t.equal(formatString('{0}', 0), '0', 'numeric zero substituted');
  t.end();
});

tape('selectPluralKey selects correct CLDR category', t => {
  const loc = DEFAULT_ARIA_LOCALE;

  t.equal(selectPluralKey('domainValues', 1, 'en', loc), 'domainValues_one');
  t.equal(selectPluralKey('domainValues', 0, 'en', loc), 'domainValues_other');
  t.equal(selectPluralKey('domainValues', 5, 'en', loc), 'domainValues_other');
  t.equal(selectPluralKey('domainBoundaries', 1, 'en', loc), 'domainBoundaries_one');
  t.equal(selectPluralKey('domainBoundaries', 2, 'en', loc), 'domainBoundaries_other');
  t.end();
});

tape('selectPluralKey falls back to _other for missing categories', t => {
  const loc = {'domainValues_other': '{0} values: {1}'};

  // locale only has _other, so even n=1 should fall back
  t.equal(selectPluralKey('domainValues', 1, 'en', loc), 'domainValues_other');
  t.equal(selectPluralKey('domainValues', 5, 'en', loc), 'domainValues_other');
  t.end();
});

tape('selectPluralKey falls back gracefully without Intl.PluralRules', t => {
  const loc = DEFAULT_ARIA_LOCALE;
  // Pass an invalid language tag to trigger the catch branch
  t.equal(selectPluralKey('domainValues', 1, '', loc), 'domainValues_one');
  t.equal(selectPluralKey('domainValues', 5, null, loc), 'domainValues_other');
  t.end();
});

tape('DEFAULT_ARIA_LOCALE contains all required keys', t => {
  const requiredKeys = [
    'containerRoleDescription',
    'markContainer', 'markRoleDescription',
    'titleText', 'subtitleText',
    'axisLabel', 'axisTitled', 'axisScaleDiscrete', 'axisScaleContinuous', 'axisWithDomain',
    'legendType', 'legendTypeDefault', 'legendTitled', 'legendForChannel', 'legendWithDomain',
    'channel.fill', 'channel.stroke',
    'listJoiner', 'listFinalJoiner',
    'domainBoundaries_one', 'domainBoundaries_other',
    'domainValues_one', 'domainValues_other',
    'domainDiscreteOverflow', 'domainContinuous',
    'orientationX', 'orientationY',
    'role.visualization', 'role.axis', 'role.legend', 'role.title', 'role.subtitle',
    'role.markContainer', 'role.mark'
  ];

  for (const key of requiredKeys) {
    t.ok(DEFAULT_ARIA_LOCALE[key] != null, `has key '${key}'`);
  }
  t.end();
});

tape('DEFAULT_ARIA_LOCALE produces expected English output', t => {
  const loc = DEFAULT_ARIA_LOCALE;

  // Axis caption assembly
  const axis = formatString(loc['axisLabel'], loc['orientationX'])
    + formatString(loc['axisTitled'], 'Revenue')
    + loc['axisScaleDiscrete']
    + formatString(loc['axisWithDomain'],
        formatString(loc['domainValues_other'], 3, ['a', 'b', 'c'].join(loc['listJoiner']))
      );
  t.equal(axis, "X-axis titled 'Revenue' for a discrete scale with 3 values: a, b, c");

  // Legend caption assembly
  let legend = formatString(loc['legendType'], 'symbol');
  legend = legend[0].toUpperCase() + legend.slice(1);
  legend += formatString(loc['legendForChannel'], loc['channel.fill']);
  legend += formatString(loc['legendWithDomain'],
    formatString(loc['domainContinuous'], '0', '100'));
  t.equal(legend, 'Symbol legend for fill color with values from 0 to 100');

  t.end();
});
