start
  = merged

merged
  = o:ordered sep "," sep m:merged { return [o].concat(m) }
  / o:ordered { return [o] }

ordered
  = "[" sep f1:filtered sep "," sep f2:filtered sep "]" sep ">" sep o:ordered { return {start: f1, end: f2, middle: o}}
  / filtered

filtered
  = s:stream f:filter+ { return (s.filters = f), s }
  / s:stream { return s }

stream
  = e:eventType { return { event: e } }
  / s:value { return { signal: s }}
  / "(" m:merged ")" { return { stream: m }}

eventType = e: "mousedown" / "mouseup" / "click" / "dblclick" / "wheel" / "keydown" / "keypress" / "keyup" / "mousewheel" / "mousemove" / "mouseout"

filter = "[" sep a:accessor field:value sep o:op sep v:value sep "]" { return a + field + o + v }
accessor = "e." / "i." / "d." / "p."
op = "==" / "!=" / ">" / ">=" / "<" / "<="
value = v:[a-zA-Z0-9_-]+ { return v.join("") }

sep = [ \t\r\n]*