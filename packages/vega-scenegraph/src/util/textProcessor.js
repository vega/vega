import {error, isArray, isFunction, isString, lruCache} from 'vega-util';

// reserved processor name that selects the standard text rendering path
const Default = 'default';

const processors = {};
const generation = {};
const cache = lruCache(1000);
const retries = lruCache(1000);

// maximum number of pending results for a text before it is treated as
// failed, so that a processor that never completes can not loop forever
const MaxRetries = 5;
const warned = {};
let warnings = [];
let pending = new Set();

// matches an optional XML prolog followed by the root svg start tag
const svgRoot = /^\s*(?:<\?xml[^>]*\?>\s*)?<svg\b([^>]*?)(\/?)>/;
// root attributes that the renderers set themselves
const svgSized = /\s(?:width|height|style|color|xmlns)\s*=\s*("[^"]*"|'[^']*')/g;

/**
 * Get or set a named text processor. A text processor converts the text
 * of a text mark item into an SVG image, for example to typeset math.
 * The processor is invoked as processor(text) and must return synchronously
 * an object {svg, width, ascent, descent[, copyText]} with metrics in
 * em units, or null if the text can not be processed. A processor that needs
 * to load resources (such as font data) may instead return a Promise: the
 * text is rendered as standard text until the Promise resolves, after which
 * the dataflow re-invokes the processor and updates the visualization.
 * @param {string} name - The text processor name.
 * @param {function|null} [processor] - The processor to register, or null
 *   to remove a previously registered processor.
 * @return {function|undefined} - The processor registered for the name.
 */
export function textProcessor(name, processor) {
  if (arguments.length < 2) {
    return processors[name];
  }
  if (name === Default) {
    error(`Text processor name "${Default}" is reserved.`);
  }
  if (processor == null) {
    delete processors[name];
  } else if (isFunction(processor)) {
    processors[name] = processor;
  } else {
    error(`Text processor "${name}" must be a function.`);
  }
  // invalidate cached results for this name
  generation[name] = (generation[name] || 0) + 1;
  delete warned[name];
  return processor;
}

/**
 * Return and clear warnings collected while processing text.
 * Warnings are issued once per unrecognized processor name and once per
 * processor failure; the dataflow reports them through its logger.
 * @return {Array<string>} - The pending warning messages.
 */
export function textProcessorWarnings() {
  const w = warnings;
  warnings = [];
  return w;
}

/**
 * Return and clear Promises for resources that text processors are loading.
 * The dataflow waits for them, then re-processes affected text.
 * @return {Array<Promise>} - The pending resource Promises.
 */
export function textProcessorPending() {
  const p = Array.from(pending);
  pending = new Set();
  return p;
}

function warn(key, message) {
  if (!warned[key]) {
    warned[key] = true;
    warnings.push(message);
  }
}

function sourceText(item) {
  const t = item.text;
  return t == null ? ''
    : (isArray(t) ? t.join(' ') : t + '').trim();
}

/**
 * Process the text of a text mark item using its text processor.
 * @param {Item} item - The text mark item.
 * @param {number} size - The font size of the item, in pixels.
 * @return {object|null} - Pixel-unit metrics and SVG markup for the
 *   processed text, or null if the standard text path should be used.
 */
export function processText(item, size) {
  const name = item.textProcessor;
  if (name == null || name === '' || name === Default) return null;

  if (!isString(name)) {
    warn(`#${name}`, `Invalid text processor: ${JSON.stringify(name)}.`);
    return null;
  }

  const proc = processors[name];
  if (!proc) {
    // results are not cached, so later registration takes effect
    warn(name, `Unrecognized text processor: "${name}".`);
    return null;
  }

  const text = sourceText(item);
  if (!text) return null;

  const key = `${name}#${generation[name]}|${text}`;

  // memoize scaled output on the item to avoid repeated allocation
  const memo = item._textProcessed;
  if (memo && memo.key === key && memo.size === size) return memo.value;

  let output;
  if (cache.has(key)) {
    output = cache.get(key);
  } else {
    output = run(proc, name, text);
    if (output && isFunction(output.then)) {
      const n = (retries.get(key) || 0) + 1;
      retries.set(key, n);
      if (n <= MaxRetries) {
        // resources are loading: use standard text for now, without caching
        pending.add(output);
        return null;
      }
      warnings.push(`Text processor "${name}" did not complete for ${JSON.stringify(text)}.`);
      output = null;
    }
    cache.set(key, output);
  }

  const value = output && size > 0 ? scale(output, size) : null;
  item._textProcessed = {key, size, value};
  return value;
}

function run(proc, name, text) {
  let out;
  try {
    out = proc(text);
  } catch (err) {
    warnings.push(`Text processor "${name}" failed for ${JSON.stringify(text)}: ${err && err.message || err}`);
    return null;
  }

  // a Promise indicates the processor is loading resources
  if (out && isFunction(out.then)) return out;

  const root = out && isString(out.svg) && out.svg.match(svgRoot);
  if (!root || !isFinite(out.width) || !isFinite(out.ascent) || !isFinite(out.descent)) {
    warnings.push(out == null
      ? `Text processor "${name}" could not process ${JSON.stringify(text)}.`
      : `Text processor "${name}" returned invalid output for ${JSON.stringify(text)}.`);
    return null;
  }

  return {
    attrs: root[1].replace(svgSized, ''),
    // self-closing root tag has no content
    content: root[2] ? '' : out.svg.slice(root[0].length).replace(/<\/svg>\s*$/, ''),
    width: +out.width,
    ascent: +out.ascent,
    descent: +out.descent,
    copyText: out.copyText != null ? out.copyText + '' : text
  };
}

function scale(out, size) {
  return {
    attrs: out.attrs,
    content: out.content,
    width: out.width * size,
    height: (out.ascent + out.descent) * size,
    ascent: out.ascent * size,
    descent: out.descent * size,
    copyText: out.copyText
  };
}

/**
 * Generate a data URL for processed text, with the given fill color.
 * MathJax and similar tools draw using currentColor, which resolves
 * against the color attribute of the root svg element.
 * @param {object} p - Processed text, as returned by processText.
 * @param {string} color - The fill color.
 * @param {number} [opacity] - The fill opacity.
 * @param {number} [ratio=1] - The pixel ratio for the intrinsic image size.
 * @return {string} - An SVG data URL.
 */
export function processedURL(p, color, opacity, ratio = 1) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"'
    + ` width="${p.width * ratio}" height="${p.height * ratio}"`
    // remove characters that could break out of the attribute value
    + ` color="${String(color).replace(/["<>&]/g, '')}"`
    + (opacity != null && opacity !== 1 ? ` fill-opacity="${opacity}"` : '')
    + p.attrs + '>' + p.content + '</svg>';
  // base64, as node-canvas does not decode percent-encoded data URLs
  return 'data:image/svg+xml;base64,' + base64(svg);
}

function base64(str) {
  const Buffer = globalThis.Buffer;
  if (Buffer) return Buffer.from(str, 'utf8').toString('base64');
  let bin = '';
  for (const b of new TextEncoder().encode(str)) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Compute the offset of the processed text box relative to the text
 * anchor point, based on the item alignment and baseline.
 * Unlike plain text, the true ascent and descent of the processed
 * output are available, so baselines are positioned exactly.
 * @param {Item} item - The text mark item.
 * @param {object} p - Processed text, as returned by processText.
 * @return {Array<number>} - The [x, y] offset of the top-left corner.
 */
export function processedOffset(item, p) {
  const a = item.align,
        b = item.baseline;
  return [
    a === 'center' ? -p.width / 2 : a === 'right' ? -p.width : 0,
    b === 'top' || b === 'line-top' ? 0
      : b === 'middle' ? -p.height / 2
      : b === 'bottom' || b === 'line-bottom' ? -p.height
      : -p.ascent // alphabetic baseline by default
  ];
}
