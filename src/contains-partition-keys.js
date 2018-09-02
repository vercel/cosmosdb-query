// @flow

function conditionKeyNodes(node: Object) {
  if (node.type === "scalar_binary_expression") {
    const { left, right } = node;
    if (node.operator === "=") {
      if (left.type === "scalar_member_expression") {
        return [[left]];
      }
    } else if (node.operator === "AND") {
      const rightNodes = conditionKeyNodes(right);
      return conditionKeyNodes(left)
        .map(a => rightNodes.map(b => [...a, ...b]))
        .reduce((a, b) => [...a, ...b], []);
    } else if (node.operator === "OR") {
      return [...conditionKeyNodes(left), ...conditionKeyNodes(right)];
    }
  }

  return [];
}

function toPartitionKey(node: Object) {
  if (node.type === "scalar_member_expression") {
    return `${toPartitionKey(node.object) || ""}/${node.property.name}`;
  }
  return null;
}

module.exports = function containsPartitionKeys(
  condition: Object,
  paths: string[]
) {
  const nodes = conditionKeyNodes(condition);
  const keys = nodes.map(n => new Set(n.map(toPartitionKey)));
  return keys.every(k => paths.every(p => k.has(p)));
};
