export default function ASTNode(type) {
  this.type = type;
}

ASTNode.prototype.visit = function(visitor) {
  var node = this, c, i, n;

  if (visitor(node)) return 1;

  for (c=children(node), i=0, n=c.length; i<n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
};

function children(node) {
  switch (node.type) {
    case 'ArrayExpression':
      return node.elements;
    case 'BinaryExpression':
    case 'LogicalExpression':
      return [node.left, node.right];
    case 'CallExpression':
      var args = node.arguments.slice();
      args.unshift(node.callee);
      return args;
    case 'ConditionalExpression':
      return [node.test, node.consequent, node.alternate];
    case 'MemberExpression':
      return [node.object, node.property];
    case 'ObjectExpression':
      return node.properties;
    case 'Property':
      return [node.key, node.value];
    case 'UnaryExpression':
      return [node.argument];
    case 'Identifier':
    case 'Literal':
    case 'RawCode':
    default:
      return [];
  }
}
