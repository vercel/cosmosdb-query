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

function cloneNode(node) {
  return JSON.parse(JSON.stringify(node));
}

function isAggregateFunction({ type, name, udf }) {
  return (
    type === "scalar_function_expression" &&
    // $FlowFixMe
    Object.prototype.hasOwnProperty.call(
      aggregateFunctions,
      name.name.toUpperCase()
    ) &&
    !udf
  );
}

function strictTrueNode(node) {
  return {
    type: "BinaryExpression",
    left: node,
    operator: "===",
    right: {
      type: "BooleanLiteral",
      value: true
    }
  };
}

function isNotUndefinedNode(argument) {
  return {
    type: "BinaryExpression",
    left: {
      type: "UnaryExpression",
      operator: "typeof",
      prefix: true,
      argument
    },
    operator: "!==",
    right: {
      type: "StringLiteral",
      value: "undefined"
    }
  };
}

function callHelperNode(name, ...args) {
  return {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: "$h"
      },
      property: {
        type: "Identifier",
        name
      }
    },
    arguments: args
  };
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
          body: strictTrueNode(transform(ctx, condition))
        }
      ]
    };
  },

  from_source(ctx, { expression, alias }) {
    return transform(ctx, alias || expression);
  },

  from_specification(ctx, { source, joins }) {
    ctx.document = transform(ctx, source);
    const exp = transform(ctx, source.expression);

    let arg;
    traverse(
      { type: "Program", body: [exp] },
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

    let object;
    if (source.iteration) {
      // e.g, "FROM c IN Families.children"
      // collection.reduce(($, Families) => [...$, ...Families.children], [])
      object = {
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
            params: [{ type: "Identifier", name: "$" }, arg],
            body: {
              type: "ArrayExpression",
              elements: [
                {
                  type: "SpreadElement",
                  argument: {
                    type: "Identifier",
                    name: "$"
                  }
                },
                {
                  type: "SpreadElement",
                  argument: exp
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
    } else if (exp.type === "MemberExpression") {
      object = {
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
            body: exp
          }
        ]
      };
    } else {
      object = ctx.ast;
    }

    return (joins || []).reduce((obj, { expression, alias, iteration }) => {
      const node = transform(ctx, alias || expression);
      const nameNode = alias ? node : node.property;
      const { document } = ctx;
      ctx.document = {
        type: "ObjectPattern",
        properties: [
          ...(document.type === "ObjectPattern"
            ? document.properties
            : [
                {
                  type: "ObjectProperty",
                  computed: false,
                  shorthand: true,
                  key: document,
                  value: document
                }
              ]),
          {
            type: "ObjectProperty",
            computed: false,
            shorthand: true,
            key: nameNode,
            value: nameNode
          }
        ]
      };

      if (iteration) {
        // e.g,
        //   FROM Families f
        //   JOIN c IN f.children
        //   JOIN p IN c.pets
        //
        // collection
        //   .reduce(($, f) => [...$, ...(f.children || []).map(c => ({ c, f }))], [])
        //   .reduce(($, { f, c }) => [...$, ...(c.pets || []).map(p => ({ c, f, p }))], [])
        return {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: obj,
            property: {
              type: "Identifier",
              name: "reduce"
            }
          },
          arguments: [
            {
              type: "ArrowFunctionExpression",
              params: [{ type: "Identifier", name: "$" }, document],
              body: {
                type: "ArrayExpression",
                elements: [
                  {
                    type: "SpreadElement",
                    argument: {
                      type: "Identifier",
                      name: "$"
                    }
                  },
                  {
                    type: "SpreadElement",
                    argument: {
                      type: "CallExpression",
                      callee: {
                        type: "MemberExpression",
                        object: {
                          type: "LogicalExpression",
                          left: transform(ctx, expression),
                          operator: "||",
                          right: {
                            type: "ArrayExpression",
                            elements: []
                          }
                        },
                        property: {
                          type: "Identifier",
                          name: "map"
                        }
                      },
                      arguments: [
                        {
                          type: "ArrowFunctionExpression",
                          params: [nameNode],
                          body: {
                            type: "ObjectExpression",
                            properties: [
                              ...(document.type === "ObjectPattern"
                                ? document.properties
                                : [
                                    {
                                      type: "ObjectProperty",
                                      computed: false,
                                      shorthand: true,
                                      key: document,
                                      value: document
                                    }
                                  ]),
                              {
                                type: "ObjectProperty",
                                computed: false,
                                shorthand: true,
                                key: nameNode,
                                value: nameNode
                              }
                            ]
                          }
                        }
                      ]
                    }
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

      // e.g,
      //   FROM Families f
      //   JOIN f.children
      //
      // collection
      //   .reduce(($, f) => (typeof f.children !== 'undefined' ? [...$, { f, children: f.children }] : $), [])
      return {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: obj,
          property: {
            type: "Identifier",
            name: "reduce"
          }
        },
        arguments: [
          {
            type: "ArrowFunctionExpression",
            params: [{ type: "Identifier", name: "$" }, document],
            body: {
              type: "ConditionalExpression",
              test: isNotUndefinedNode(node),
              consequent: {
                type: "ArrayExpression",
                elements: [
                  {
                    type: "SpreadElement",
                    argument: {
                      type: "Identifier",
                      name: "$"
                    }
                  },
                  {
                    type: "ObjectExpression",
                    properties: [
                      ...(document.type === "ObjectPattern"
                        ? document.properties
                        : [
                            {
                              type: "ObjectProperty",
                              computed: false,
                              shorthand: true,
                              key: document,
                              value: document
                            }
                          ]),
                      {
                        type: "ObjectProperty",
                        computed: false,
                        shorthand: true,
                        key: nameNode,
                        value: node
                      }
                    ]
                  }
                ]
              },
              alternate: {
                type: "Identifier",
                name: "$"
              }
            }
          },
          {
            type: "ArrayExpression",
            elements: []
          }
        ]
      };
    }, object);
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

  scalar_between_expression(ctx, { value, begin, end }) {
    const left = transform(ctx, value);
    return {
      type: "BinaryExpression",
      left: {
        type: "BinaryExpression",
        left,
        operator: ">=",
        right: transform(ctx, begin)
      },
      operator: "&&",
      right: {
        type: "BinaryExpression",
        left,
        operator: "<=",
        right: transform(ctx, end)
      }
    };
  },

  scalar_binary_expression(ctx, { left, operator, right }) {
    const l = transform(ctx, left);
    const r = transform(ctx, right);

    if (operator === "??") {
      // `typeof left !== "undefined" ? left : right`
      return {
        type: "ConditionalExpression",
        test: isNotUndefinedNode(l),
        consequent: l,
        alternate: r
      };
    }

    if (operator === "AND") {
      return callHelperNode("and", l, r);
    }
    if (operator === "OR") {
      return callHelperNode("or", l, r);
    }
    if (operator === "=") {
      return callHelperNode("equal", l, r);
    }
    if (operator === "!=" || operator === "<>") {
      return callHelperNode("notEqual", l, r);
    }
    if (
      operator === ">" ||
      operator === "<" ||
      operator === ">=" ||
      operator === "<="
    ) {
      return callHelperNode(
        "compare",
        {
          type: "StringLiteral",
          value: operator
        },
        l,
        r
      );
    }
    if (operator === "||") {
      return callHelperNode("concat", l, r);
    }

    return {
      type: "BinaryExpression",
      left: l,
      operator,
      right: r
    };
  },

  scalar_conditional_expression(ctx, { test, consequent, alternate }) {
    return {
      type: "ConditionalExpression",
      test: strictTrueNode(transform(ctx, test)),
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
                name: "$_"
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

  scalar_in_expression(ctx, { value, list }) {
    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: {
          type: "ArrayExpression",
          elements: list.map(l => transform(ctx, l))
        },
        property: {
          type: "Identifier",
          name: "includes"
        }
      },
      arguments: [transform(ctx, value)]
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
    const node = transform(ctx, argument);
    const op = operator === "NOT" ? "!" : operator;

    if (op === "!") {
      return callHelperNode("not", node);
    }

    return {
      type: "UnaryExpression",
      operator: op,
      argument: transform(ctx, argument)
    };
  },

  select_query(ctx, { top, select, from, where, orderBy }) {
    if (from) {
      ctx.ast = {
        type: "Identifier",
        name: "$c"
      };
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
          name: "$c"
        },
        // helper functions
        {
          type: "Identifier",
          name: "$h"
        },
        // parameters
        {
          type: "Identifier",
          name: "$p"
        },
        // intermediate cache
        {
          type: "Identifier",
          name: "$_"
        }
      ],
      body: callHelperNode("stripUndefined", ctx.ast)
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
              name: "$_"
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
            { type: "Identifier", name: "$1" },
            { type: "Identifier", name: "$2" }
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
    const right = cloneNode(left);

    [["$1", left], ["$2", right]].forEach(([name, node]) => {
      traverse(
        { type: "Program", body: [node] },
        {
          MemberExpression(path) {
            const { object } = path.node;
            if (object.type === "Identifier") {
              // eslint-disable-next-line no-param-reassign
              path.node.object =
                ctx.document.type === "ObjectPattern"
                  ? {
                      type: "MemberExpression",
                      object: {
                        type: "Identifier",
                        name
                      },
                      property: object
                    }
                  : {
                      type: "Identifier",
                      name
                    };
              path.stop();
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
        transform(ctx, value)
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
