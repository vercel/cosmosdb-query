// @flow
const { default: traverse } = require("@babel/traverse");
const aggregateFunctions = require("./aggregate-functions");

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

function isAggregateFunction({ type, name, udf }) {
  return (
    type === "scalar_function_expression" &&
    // $FlowFixMe
    Object.protorype.hasOwnProperty.call(
      aggregateFunctions,
      name.name.toUpperCase()
    ) &&
    !udf
  );
}

const definitions = {
  array_constant(ctx, { elements }) {
    return {
      type: "ArrayExpression",
      elements: elements.map(v => transform(ctx, v))
    };
  },

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

  object_constant(ctx, { properties }) {
    return {
      type: "ObjectExpression",
      properties: properties.map(({ key, value }) => ({
        type: "ObjectProperty",
        key: transform(ctx, key),
        value: transform(ctx, value)
      }))
    };
  },

  object_property_list(ctx, { properties }) {
    let n = 0;
    return {
      type: "ObjectExpression",
      properties: properties.map(({ property, alias }) => {
        const key = alias || property.property;
        return {
          type: "ObjectProperty",
          key: key
            ? transform(ctx, key)
            : // eslint-disable-next-line no-plusplus
              { type: "Identifier", name: `$${++n}` },
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
        name: "$p"
      },
      property: {
        type: "Identifier",
        name: name.slice(1)
      }
    };
  },

  scalar_array_expression(ctx, { elements }) {
    return {
      type: "ArrayExpression",
      elements: elements.map(v => transform(ctx, v))
    };
  },

  scalar_binary_expression(ctx, { left, operator, right }) {
    const op =
      {
        "=": "===",
        "!=": "!==",
        "<>": "!==",
        "||": "+",
        AND: "&&",
        OR: "||"
      }[operator] || operator;

    const l = transform(ctx, left);
    const r = transform(ctx, right);

    if (op === "??") {
      // `typeof left !== "undefined" ? left : right`
      return {
        type: "ConditionalExpression",
        test: {
          type: "BinaryExpression",
          left: {
            type: "UnaryExpression",
            operator: "typeof",
            prefix: true,
            argument: l
          },
          operator: "!==",
          right: {
            type: "StringLiteral",
            value: "undefined"
          }
        },
        consequent: l,
        alternate: r
      };
    }

    return {
      type: "BinaryExpression",
      left: l,
      operator: op,
      right: r
    };
  },

  scalar_conditional_expression(ctx, { test, consequent, alternate }) {
    return {
      type: "ConditionalExpression",
      test: transform(ctx, test),
      consequent: transform(ctx, consequent),
      alternate: transform(ctx, alternate)
    };
  },

  scalar_function_expression(ctx, { type, name, arguments: args, udf }) {
    const aggregation =
      ctx.aggregation && isAggregateFunction({ type, name, udf });

    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          // eslint-disable-next-line no-nested-ternary
          name: udf ? "udf" : aggregation ? "$a" : "$b"
        },
        property: transform(ctx, name)
      },
      arguments: aggregation
        ? args.map(a => ({
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: {
                type: "Identifier",
                name: "$"
              },
              property: {
                type: "Identifier",
                name: "map"
              }
            },
            arguments: [
              {
                type: "ArrowFunctionExpression",
                params: ctx.document ? [ctx.document] : [],
                body: transform(ctx, a)
              }
            ]
          }))
        : args.map(a => transform(ctx, a))
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

  select_query(ctx, { top, select, from, where, orderBy }) {
    const name = "$c";

    if (from) {
      ctx.ast = {
        type: "Identifier",
        name
      };
      ctx.document = transform(
        ctx,
        from.source.alias || from.source.expression
      );
      ctx.ast = transform(ctx, from);
    } else {
      ctx.ast = {
        type: "ArrayExpression",
        elements: [
          {
            type: "NullLiteral"
          }
        ]
      };
    }

    if (where) {
      ctx.ast = transform(ctx, where);
    }

    if (orderBy) {
      ctx.ast = transform(ctx, orderBy);
    }

    if (top) {
      ctx.ast = transform(ctx, top);
    }

    ctx.ast = transform(ctx, select);

    return {
      type: "ArrowFunctionExpression",
      params: [
        // aggregate functions
        {
          type: "Identifier",
          name: "$a"
        },
        // built-in functions
        {
          type: "Identifier",
          name: "$b"
        },
        // document array (collection)
        {
          type: "Identifier",
          name
        },
        // parameters
        {
          type: "Identifier",
          name: "$p"
        },
        // intermediate cache
        {
          type: "Identifier",
          name: "$"
        }
      ],
      body: ctx.ast
    };
  },

  select_specification(ctx, { "*": all, properties, value }) {
    if (all) {
      return ctx.ast;
    }

    ctx.aggregation = properties
      ? properties.properties.some(({ property }) =>
          isAggregateFunction(property)
        )
      : isAggregateFunction(value);
    if (ctx.aggregation) {
      // `($ = $c.filter(), [{ $1: COUNT($.map(c => c.id)), $2: ... }])`
      return {
        type: "SequenceExpression",
        expressions: [
          // cache filtered result to a variable
          {
            type: "AssignmentExpression",
            left: {
              type: "Identifier",
              name: "$"
            },
            operator: "=",
            right: ctx.ast
          },
          {
            type: "ArrayExpression",
            elements: [transform(ctx, properties || value)]
          }
        ]
      };
    }

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
          params: ctx.document ? [ctx.document] : [],
          body: transform(ctx, properties || value)
        }
      ]
    };
  },

  sort_specification(ctx, { expressions }) {
    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: ctx.ast,
            property: {
              type: "Identifier",
              name: "slice"
            }
          },
          arguments: []
        },
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

  top_specification(ctx, { value }) {
    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: ctx.ast,
        property: {
          type: "Identifier",
          name: "slice"
        }
      },
      arguments: [
        {
          type: "NumericLiteral",
          value: 0
        },
        {
          type: "NumericLiteral",
          value
        }
      ]
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
