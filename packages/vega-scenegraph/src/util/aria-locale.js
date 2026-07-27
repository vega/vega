/**
 * Default English aria locale strings for Vega chart accessibility labels.
 * Uses {N} indexed placeholders for positional argument substitution.
 */
export const DEFAULT_ARIA_LOCALE = {
  // Container
  'containerRoleDescription': 'visualization',

  // Marks
  'markContainer': '{0} mark container',
  'markRoleDescription': '{0} mark',

  // Titles
  'titleText': "Title text '{0}'",
  'subtitleText': "Subtitle text '{0}'",

  // Axes
  'axisLabel': '{0}-axis',
  'axisTitled': " titled '{0}'",
  'axisScaleDiscrete': ' for a discrete scale',
  'axisScaleContinuous': ' for a {0} scale',
  'axisWithDomain': ' with {0}',

  // Legends
  'legendType': '{0} legend',
  'legendTypeDefault': 'Legend',
  'legendTitled': " titled '{0}'",
  'legendForChannel': ' for {0}',
  'legendWithDomain': ' with {0}',

  // Channel names
  'channel.fill': 'fill color',
  'channel.stroke': 'stroke color',
  'channelJoiner': ', ',
  'channelFinalJoiner': ' and ',

  // Domain captions — CLDR plural suffixes
  'domainBoundaries_one': '{0} boundary: {1}',
  'domainBoundaries_other': '{0} boundaries: {1}',
  'domainValues_one': '{0} value: {1}',
  'domainValues_other': '{0} values: {1}',
  'domainDiscreteOverflow': '{0}, ending with {1}',
  'domainContinuous': 'values from {0} to {1}',

  // Orientation mapping
  'orientationX': 'X',
  'orientationY': 'Y',

  // Role descriptions
  'role.visualization': 'visualization',
  'role.axis': 'axis',
  'role.legend': 'legend',
  'role.title': 'title',
  'role.subtitle': 'subtitle',
  'role.markContainer': '{0} mark container',
  'role.mark': '{0} mark'
};

/**
 * Replace {N} placeholders with positional arguments.
 * @param {string} template - Template string with {0}, {1}, etc.
 * @param {...(string|number)} args - Replacement values.
 * @returns {string}
 */
export function formatString(template, ...args) {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    const i = parseInt(index, 10);
    return i < args.length ? String(args[i]) : match;
  });
}

/**
 * Select the appropriate CLDR-suffixed locale key for a count.
 * Uses Intl.PluralRules when available, falls back to singular/plural.
 * @param {string} baseKey - e.g., 'domainValues'
 * @param {number} n - the count
 * @param {string} languageTag - BCP 47 tag (e.g., 'ar', 'pl', 'en')
 * @param {Record<string, string>} loc - the locale strings
 * @returns {string} the resolved key (e.g., 'domainValues_few')
 */
export function selectPluralKey(baseKey, n, languageTag, loc) {
  let category;

  if (typeof Intl !== 'undefined' && Intl.PluralRules) {
    try {
      const pr = new Intl.PluralRules(languageTag || 'en');
      category = pr.select(n);
    } catch (e) {
      category = null;
    }
  }

  if (!category) {
    category = (n === 1) ? 'one' : 'other';
  }

  const key = `${baseKey}_${category}`;
  return (loc[key] != null) ? key : `${baseKey}_other`;
}
