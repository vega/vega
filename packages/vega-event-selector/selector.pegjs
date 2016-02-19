start
  = merged

merged
  = o:ordered sep "," sep m:merged { return [o].concat(m); }
  / o:ordered { return [o]; }

ordered
  = "[" sep f1:filtered sep "," sep f2:filtered sep "]" sep ">" sep o:ordered { return {start: f1, end: f2, middle: o}; }
  / filtered

filtered
  = s:stream f:filter+ { return (s.filters = f, s); }
  / s:stream { return s; }

stream
  = "(" m:merged ")" { return {stream: m}; }
  / "@" n:name ":" e:eventType { return {event: e, name: n}; }
  / m:markType ":" e:eventType { return {event: e, mark: m}; }
  / t:css ":" e:eventType { return {event: e, target: t}; }
  / e:eventType { return {event: e}; }
  / s:name { return {signal: s}; }


markType = m: "rect" / "symbol" / "path" / "arc" / "area" / "line" / "rule" / "image" / "text" / "group"

eventType = e: "mousedown" / "mouseup" / "click" / "dblclick" / "wheel" / "keydown" / "keypress" / "keyup" / "mousewheel" / "mousemove" / "mouseout" / "mouseover" / "mouseenter" / "touchstart" / "touchmove" / "touchend" / "dragenter" / "dragover" / "dragleave"

filter = "[" e:expr "]" { return e; }

name = n:[a-zA-Z0-9_-]+ { return n.join(""); }
css  = c:[a-zA-Z0-9-_  #\.\>\+~\[\]=|\^\$\*]+ { return c.join(""); }
expr = v:['"a-zA-Z0-9_\(\)\.\>\<\=\! \t-&|~]+ { return v.join(""); }
sep = [ \t\r\n]*
