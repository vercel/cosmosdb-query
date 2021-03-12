function conditionKeyNodes(node: { [x: string]: any }): any[] {
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

function toPartitionKey(node: { [x: string]: any }): string | null {
  if (node.type === "scalar_member_expression") {
    return `${toPartitionKey(node.object) || ""}/${node.property.name || node.property.value}`;
  }
  return null;
}

export default function containsPartitionKeys(
  ast: {
    [x: string]: any;
  },
  paths: string[]
) {
  if (!paths.length) return true;
  if (!ast.body || !ast.body.where) return false;

  const { condition } = ast.body.where;
  const nodes = conditionKeyNodes(condition);
  const keys = nodes.map(n => new Set(n.map(toPartitionKey)));
  return keys.every(k => paths.every(p => k.has(p)));
}
