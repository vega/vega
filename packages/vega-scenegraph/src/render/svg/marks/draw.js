var d3 = require('d3'),
    DOM = require('../../../util/dom');

module.exports = function(g, scene, index, mark) {
  var renderer = this,
      data = mark.nested ? [scene.items] : scene.items || [],
      events = scene.interactive === false ? 'none' : null,
      groups = g.node().childNodes,
      isGroup = (mark.tag === 'g');
  
  var p = (p = groups[index+1]) ? // +1 to skip group background rect
    d3.select(p) :
    g.append('g')
      .attr('id', 'g' + (renderer._defs.group_id++))
      .attr('class', DOM.cssClass(scene));

  var id = p.attr('id'),
      s = '#' + id + ' > ' + mark.tag,
      m = p.selectAll(s).data(data),
      e = m.enter().append(mark.tag);

  if (isGroup) {
    e.append('rect')
      .attr('class', 'background')
      .attr('width', 0)
      .attr('height', 0)
      .style('pointer-events', events);    
  } else {
    if (events) p.style('pointer-events', events);
    e.each(function(d) {
      if (d.mark) d._svg = this;
      else if (d.length) d[0]._svg = this;
    });
  }
  
  m.exit().remove();
  m.each(function(o) {
    mark.update.call(renderer, this, o);
    renderer.style(isGroup ? this.childNodes[0] : this, o);
  });
  return p;
};