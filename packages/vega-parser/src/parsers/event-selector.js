import {isMarkType} from '../marktypes';

/**
 * Parse an event selector string.
 * Returns an array of event stream definitions.
 * TODO: support debounce, consume
 */
export default function(selector) {
  return parseMerge(selector.trim())
    .map(parseSelector);
}

var LBRACK = '[',
    RBRACK = ']',
    COLON  = ':',
    COMMA  = ',',
    GT = '>';

var ILLEGAL = /[\[\]\{\}]/;

function find(s, i, endChar, pushChar, popChar) {
  var count = 0,
      n = s.length,
      c;
  for (; i<n; ++i) {
    c = s[i];
    if (c === popChar) --count;
    if (c === endChar && !count) return i;
    else if (c === pushChar) ++count;
  }
  return i;
}

function parseMerge(s) {
  var output = [],
      start = 0,
      n = s.length,
      i = 0;

  while (i < n) {
    i = find(s, i, COMMA, LBRACK, RBRACK);
    output.push(s.substring(start, i).trim());
    start = ++i;
  }

  if (output.length === 0) throw s;
  return output;
}

function parseSelector(s) {
  return s[0] === '['
    ? parseBetween(s)
    : parseStream(s);
}

function parseBetween(s) {
  var start = 1,
      n = s.length,
      i = 1,
      b, stream;

  i = find(s, i, RBRACK, LBRACK);
  if (i === n) throw s;

  b = parseMerge(s.substring(start, i));
  if (b.length !== 2) throw s;

  s = s.slice(i + 1).trim();
  if (s[0] !== GT) throw s;

  b = b.map(parseSelector);

  stream = parseSelector(s.slice(1).trim());
  if (stream.between) {
    return {
      between: b,
      stream: stream
    };
  } else {
    stream.between = b;
  }

  return stream;
}

function parseStream(s) {
  var stream = {source: 'view'},
      source = [],
      markname = 0,
      start = 0,
      n = s.length,
      i = 0, j,
      filter, throttle;

  // extract throttle from end
  if (s[n-1] === '}') {
    i = s.lastIndexOf('{');
    if (i >= 0) {
      throttle = s.substring(i+1, n-1);
      s = s.slice(0, i).trim();
      n = s.length;
    } else throw s;
    i = 0;
  }

  if (!n) throw s;

  // set name flag based on first char
  if (s[0] === '@') markname = ++i;

  // extract first part of multi-part stream selector
  j = find(s, i, COLON);
  if (j < n) {
    source.push(s.substring(start, j).trim());
    start = i = ++j;
  }

  // extract remaining part of stream selector
  i = find(s, i, LBRACK);
  if (i === n) {
    source.push(s.substring(start, n).trim());
  } else {
    source.push(s.substring(start, i).trim());
    filter = [];
    start = ++i;
    if (start === n) throw s;
  }

  // extract filters
  while (i < n) {
    i = find(s, i, RBRACK);
    if (i === n) throw s;
    filter.push(s.substring(start, i).trim());
    if (i < n-1 && s[++i] !== LBRACK) throw s;
    start = ++i;
  }

  // marshall event stream specification
  if (!(n = source.length) || ILLEGAL.test(source[n-1])) throw s;

  if (n > 1) {
    stream.type = source[1];
    if (markname) {
      stream.markname = source[0].slice(1);
    } else if (isMarkType(source[0])) {
      stream.marktype = source[0];
    } else {
      stream.source = source[0];
    }
  } else {
    stream.type = source[0];
  }
  if (filter != null) stream.filter = filter;
  if (throttle != null) stream.throttle = +throttle;

  return stream;
}
