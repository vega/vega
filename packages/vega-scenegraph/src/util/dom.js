var d3 = require('d3');

function appendUnique(el, tag, className) {
  // remove any existing elements
  var sel = d3.select(el);
  sel.selectAll(tag + '.' + className).remove();

  // add element to the document
  return d3.select(sel.node().appendChild(tag))
    .attr('class', className);
}

module.exports = {
  appendUnique: appendUnique
};
