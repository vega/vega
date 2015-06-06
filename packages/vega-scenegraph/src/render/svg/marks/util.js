var d3 = require('d3'),
    dl = require('datalib'),
    svg = require('../../../util/svg'),
    styleProperties = svg.styleProperties,
    styles = svg.styles;

var mark_id = 0; // TODO centralize?

function draw(tag, attr, nest) {
  return function(g, scene, index) {
    drawMark(g, scene, index, tag, attr, nest);
  };
}

function cssClass(mark) {
  return 'type-' + mark.marktype + (mark.name ? ' '+mark.name : '');
}

function drawMark(g, scene, index, tag, attr, nest) {
  var data = nest ? [scene.items] : scene.items,
      events = scene.interactive === false ? 'none' : null,
      groups = g.node().childNodes,
      isGroup = (tag === 'g');
  
  var p = (p = groups[index+1]) ? // +1 to skip group background rect
    d3.select(p) :
    g.append('g')
      .attr('id', 'g'+(++mark_id))
      .attr('class', cssClass(scene));

  var id = p.attr('id'),
      s = '#' + id + ' > ' + tag,
      m = p.selectAll(s).data(data),
      e = m.enter().append(tag);

  if (isGroup) {
    e.append('rect')
      .attr('class','background')
      .style('pointer-events', events);    
  } else {
    p.style('pointer-events', events);
    e.each(function(d) {
      if (d.mark) d._svg = this;
      else if (d.length) d[0]._svg = this;
    });
  }
  
  m.exit().remove();
  m.each(attr);
  if (isGroup) {
    p.selectAll(s+' > rect.background')
      .each(group_bg)
      .each(style);
  } else {
    m.each(style);
  }
  return p;
}

function group_bg(o) {
  var w = o.width || 0,
      h = o.height || 0;
  this.setAttribute("width", w);
  this.setAttribute("height", h);
}

function style(d) {
  var i, n, prop, name, value,
      o = dl.isArray(d) ? d[0] : d;
  if (o === null) return;

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        this.style.setProperty(name, 'none', null);
      } else {
        this.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        // ensure definition is included
        util.defs.gradient[value.id] = value;
        value = 'url(' + window.location.href + '#' + value.id + ')';
      }
      this.style.setProperty(name, value+'', null);
    }
  }
}

var util = module.exports = {
  draw:     draw,
  drawMark: drawMark,
  styles:   style,
  defs:     null
};
