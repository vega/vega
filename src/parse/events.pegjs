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
  = t:(class / id)? e:eventType { return { event: e, target: t } }
  / s:[:a-zA-z0-9_-]+ { return { signal: s.join("") }}
  / "(" m:merged ")" { return { stream: m }}

class = "." c:value ":" { return { type:'class', value: c } }
id = "#" id: value ":" { return { type:'id', value: id } }

eventType = e: "mousedown" / "mouseup" / "click" / "dblclick" / "wheel" / "keydown" / "keypress" / "keyup" / "mousewheel" / "mousemove" / "mouseout" / "mouseover" / "mouseenter"

filter = "[" sep a:accessor field:value sep o:op sep v:value sep "]" { return a + field + o + v }
accessor = "e." / "i." / "d." / "p."
op = "==" / "!=" / ">" / ">=" / "<" / "<="
value = v:['"a-zA-Z0-9_-]+ { return v.join("") }

sep = [ \t\r\n]*