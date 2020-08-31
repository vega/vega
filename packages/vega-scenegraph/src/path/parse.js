// Path parsing and rendering code adapted from fabric.js -- Thanks!
const cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 },
      regexp = [
        /([MLHVCSQTAZmlhvcsqtaz])/g,
        /###/,
        /(\.\d+)(\.\d)/g,
        /(\d)([-+])/g,
        /\s|,|###/
      ];

export default function(pathstr) {
  const result = [];
  let curr,
      chunks,
      parsed, param,
      cmd, len, i, j, n, m;

  // First, break path into command sequence
  const path = pathstr
    .slice()
    .replace(regexp[0], '###$1')
    .split(regexp[1])
    .slice(1);

  // Next, parse each command in turn
  for (i = 0, n = path.length; i < n; ++i) {
    curr = path[i];
    chunks = curr
      .slice(1)
      .trim()
      .replace(regexp[2], '$1###$2')
      .replace(regexp[3], '$1###$2')
      .split(regexp[4]);
    cmd = curr.charAt(0);

    parsed = [cmd];
    for (j = 0, m = chunks.length; j < m; ++j) {
      if ((param = +chunks[j]) === param) { // not NaN
        parsed.push(param);
      }
    }

    len = cmdlen[cmd.toLowerCase()];
    if (parsed.length - 1 > len) {
      const m = parsed.length;
      j = 1;
      result.push([cmd].concat(parsed.slice(j, j += len)));

      // handle implicit lineTo (#2803)
      cmd = cmd === 'M' ? 'L' : cmd === 'm' ? 'l' : cmd;

      for (; j < m; j += len) {
        result.push([cmd].concat(parsed.slice(j, j+len)));
      }
    }
    else {
      result.push(parsed);
    }
  }

  return result;
}
