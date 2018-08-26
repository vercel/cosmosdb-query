// @flow
const { default: traverse } = require("@babel/traverse");

function transform(ctx: { ast?: Object, document?: Object }, node: Object) {
  // eslint-disable-next-line no-use-before-define
  const def = definitions[node.type];
  if (!def) {
    throw new Error(`Invalid type: ${node.type}`);
  }

  return def(ctx, node);
}

function clone(node) {
  return JSON.parse(JSON.stringify(node));
}

const definitions = {
  boolean_constant(ctx, { value }) {
    return {
      type: "BooleanLiteral",
      value
    };
  },

  collection_expression(ctx, { expression }) {
    return transform(ctx, expression);
  },

  collection_member_expression(ctx, { object, property, computed }) {
    return {
      type: "MemberExpression",
      object: transform(ctx, object),
      property: transform(ctx, property),
      computed
    };
  },

  filter_condition(ctx, { condition }) {
    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: ctx.ast,
        property: {
          type: "Identifier",
          name: "filter"
        }
      },
      arguments: [
        {
          type: "ArrowFunctionExpression",
          params: [ctx.document],
          body: transform(ctx, condition)
        }
      ]
    };
  },

  from_source(ctx, { expression, alias }) {
    return transform(ctx, alias || expression);
  },

  from_specification(ctx, { source }) {
    const node = transform(ctx, source.expression);

    let arg;
    traverse(
      { type: "Program", body: [node] },
      {
        MemberExpression(path) {
          const { object } = path.node;
          if (object.type === "Identifier") {
            arg = object;
            path.stop();
          }
        }
      }
    );

    if (source.iteration) {
      return {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: ctx.ast,
          property: {
            type: "Identifier",
            name: "reduce"
          }
        },
        arguments: [
          {
            type: "ArrowFunctionExpression",
            params: [{ type: "Identifier", name: "__" }, arg],
            body: {
              type: "ArrayExpression",
              elements: [
                {
                  type: "SpreadElement",
                  argument: {
                    type: "Identifier",
                    name: "__"
                  }
                },
                {
                  type: "SpreadElement",
                  argument: node
                }
              ]
            }
          },
          {
            type: "ArrayExpression",
            elements: []
          }
        ]
      };
    }

    if (node.type === "MemberExpression") {
      return {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: ctx.ast,
          property: {
            type: "Identifier",
            name: "map"
          }
        },
        arguments: [
          {
            type: "ArrowFunctionExpression",
            params: [arg],
            body: node
          }
        ]
      };
    }

    return ctx.ast;
  },

  identifier(ctx, { name }) {
    return {
      type: "Identifier",
      name
    };
  },

  null_constant() {
    return { type: "NullLiteral" };
  },

  number_constant(ctx, { value }) {
    return {
      type: "NumericLiteral",
      value
    };
  },

  object_property_list(ctx, { properties }) {
    return {
      type: "ObjectExpression",
      properties: properties.map(({ property, alias }, i) => {
        const key = alias || property.property;
        return {
          type: "ObjectProperty",
          key: key
            ? transform(ctx, key)
            : { type: "Identifier", name: `$${i + 1}` },
          value: transform(ctx, property)
        };
      })
    };
  },

  parameter_name(ctx, { name }) {
    return {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: "__p"
      },
      property: {
        type: "Identifier",
        name: name.slice(1)
      }
    };
  },

  scalar_binary_expression(ctx, { left, operator, right }) {
    const op =
      {
        "=": "===",
        "!=": "!==",
        "<>": "!==",
        AND: "&&",
        OR: "||"
      }[operator] || operator;

    if (op === "??") {
      throw new Error("The operator ?? is not supported yet");
    }

    return {
      type: "BinaryExpression",
      left: transform(ctx, left),
      operator: op,
      right: transform(ctx, right)
    };
  },

  scalar_member_expression(ctx, { object, property, computed }) {
    return {
      type: "MemberExpression",
      object: transform(ctx, object),
      property: transform(ctx, property),
      computed
    };
  },

  scalar_object_expression(ctx, { properties }) {
    return {
      type: "ObjectExpression",
      properties: properties.map(({ key, value }) => ({
        type: "ObjectProperty",
        key: transform(ctx, key),
        value: transform(ctx, value)
      }))
    };
  },

  scalar_unary_expression(ctx, { operator, argument }) {
    const op = operator === "NOT" ? "!" : operator;
    return {
      type: "UnaryExpression",
      operator: op,
      argument: transform(ctx, argument)
    };
  },

  select_query(ctx, { select, from, where, orderBy }) {
    const name = "__c";

    ctx.ast = {
      type: "Identifier",
      name
    };

    if (from) {
      ctx.document = transform(
        ctx,
        from.source.alias || from.source.expression
      );
      ctx.ast = transform(ctx, from);
    }

    if (where) {
      ctx.ast = transform(ctx, where);
    }

    if (orderBy) {
      ctx.ast = transform(ctx, orderBy);
    }

    ctx.ast = transform(ctx, select);

    return {
      type: "ArrowFunctionExpression",
      params: [
        {
          type: "Identifier",
          name
        },
        {
          type: "Identifier",
          name: "__p"
        }
      ],
      body: ctx.ast
    };
  },

  select_specification(ctx, { "*": all, properties }) {
    if (all) {
      return ctx.ast;
    }

    if (properties) {
      return {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: ctx.ast,
          property: {
            type: "Identifier",
            name: "map"
          }
        },
        arguments: [
          {
            type: "ArrowFunctionExpression",
            params: [ctx.document],
            body: transform(ctx, properties)
          }
        ]
      };
    }

    return ctx.ast;
  },

  sort_specification(ctx, { expressions }) {
    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: ctx.ast,
        property: {
          type: "Identifier",
          name: "sort"
        }
      },
      arguments: [
        {
          type: "ArrowFunctionExpression",
          params: [
            { type: "Identifier", name: "a" },
            { type: "Identifier", name: "b" }
          ],
          body: expressions.reduce((left, right) => {
            if (left) {
              return {
                type: "LogicalExpression",
                left,
                operator: "||",
                right: transform(ctx, right)
              };
            }

            return transform(ctx, right);
          }, null)
        }
      ]
    };
  },

  sort_expression(ctx, { expression, order }) {
    const left = transform(ctx, expression);
    const right = clone(left);

    [["a", left], ["b", right]].forEach(([name, node]) => {
      traverse(
        { type: "Program", body: [node] },
        {
          MemberExpression(path) {
            const { object } = path.node;
            if (
              object.type === "Identifier" &&
              object.name === ctx.document.name
            ) {
              object.name = name;
            }
          }
        }
      );
    });

    const ast = {
      type: "ConditionalExpression",
      test: {
        type: "MemberExpression",
        object: left,
        property: {
          type: "Identifier",
          name: "localeCompare"
        }
      },
      consequent: {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: left,
          property: {
            type: "Identifier",
            name: "localeCompare"
          }
        },
        arguments: [right]
      },
      alternate: {
        type: "BinaryExpression",
        left,
        operator: "-",
        right
      }
    };

    return order === "DESC"
      ? {
          type: "UnaryExpression",
          operator: "-",
          argument: ast
        }
      : ast;
  },

  string_constant(ctx, { value }) {
    return {
      type: "StringLiteral",
      value
    };
  },

  undefined_constant() {
    return {
      type: "Identifier",
      name: "undefined"
    };
  }
};

module.exports = (sqlAst: Object) => transform({}, sqlAst);
