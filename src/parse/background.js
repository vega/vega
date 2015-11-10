var d3 = require('d3');

function parseBg(bg) {
  // return null if input is null or undefined
  if (bg == null) return null;
  // run through d3 rgb to sanity check
  return d3.rgb(bg) + '';
}

module.exports = parseBg;

parseBg.schema = {"defs": {"background": {"type": "string"}}};
