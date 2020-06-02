export const RawCode = 'RawCode';
export const Literal = 'Literal';
export const Property = 'Property';
export const Identifier = 'Identifier';

export const ArrayExpression = 'ArrayExpression';
export const BinaryExpression = 'BinaryExpression';
export const CallExpression = 'CallExpression';
export const ConditionalExpression = 'ConditionalExpression';
export const LogicalExpression = 'LogicalExpression';
export const MemberExpression = 'MemberExpression';
export const ObjectExpression = 'ObjectExpression';
export const UnaryExpression = 'UnaryExpression';

export default function ASTNode(type) {
  this.type = type;
}

ASTNode.prototype.visit = function(visitor) {
  let c, i, n;

  if (visitor(this)) return 1;

  for (c=children(this), i=0, n=c.length; i<n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
};

function children(node) {
  switch (node.type) {
    case ArrayExpression:
      return node.elements;
    case BinaryExpression:
    case LogicalExpression:
      return [node.left, node.right];
    case CallExpression:
      return [node.callee].concat(node.arguments);
    case ConditionalExpression:
      return [node.test, node.consequent, node.alternate];
    case MemberExpression:
      return [node.object, node.property];
    case ObjectExpression:
      return node.properties;
    case Property:
      return [node.key, node.value];
    case UnaryExpression:
      return [node.argument];
    case Identifier:
    case Literal:
    case RawCode:
    default:
      return [];
  }
}
