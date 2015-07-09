// Strip schema definitions from source files for smaller
// built file size. We do this by building an AST of source
// files and removing everything after the module.exports = (.*) expr.

var jstransform = require('jstransform'),
    jstutils = require('jstransform/src/utils'),
    Syntax = jstransform.Syntax,
    through = require('through');

module.exports = function(file) {
  var data = '';

  function visitModuleExportsExpr(traverse, node, path, state) {
    jstutils.catchup(node.range[1]+1, state); // Last line is module.exports = (.*);
    jstutils.move(data.length, state); // Skip over schema definitions
  }

  visitModuleExportsExpr.test = function(node, path, state) {
    if (node.type !== Syntax.AssignmentExpression) return false;
    if (node.left.type !== Syntax.MemberExpression) return false;
    if (node.left.object.type !== Syntax.Identifier) return false;
    if (node.left.property.type !== Syntax.Identifier) return false;
    if (node.left.object.name !== "module") return false;
    if (node.left.property.name !== "exports") return false;

    return true;
  };

  return through(function(buf) { data += buf }, function() {
    var stripped = jstransform.transform(
      [visitModuleExportsExpr],
      data
    );
    this.queue(stripped.code);
    this.queue(null);
  });
};