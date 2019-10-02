import traverse from "@babel/traverse";
import * as aggregateFunctions from "./aggregate-functions";
// @ts-ignore
import { SyntaxError } from "./parser"; // eslint-disable-line import/no-unresolved

type Context = {
  aggregation?: boolean;
  ast?: any;
  highCardinality?: boolean;
  document?: any;
  orderBy?: any;
};

function transform(contexts: Context[], node: { [x: string]: any }) {
  // eslint-disable-next-line no-use-before-define
  const def = definitions[node.type];
  if (!def) {
    throw new Error(`Invalid type: ${node.type}`);
  }

  return def(contexts, node);
}

function isAggregateFunction({
  type,
  name,
  udf
}: {
  type: string;
  name: any;
  udf: boolean;
}) {
  return (
    type === "scalar_function_expression" &&
    Object.prototype.hasOwnProperty.call(
      aggregateFunctions,
      name.name.toUpperCase()
    ) &&
    !udf
  );
}

function strictTrueNode(node: any) {
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

function isNotUndefinedNode(argument: any) {
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

function callHelperNode(name: string, ...args: any[]) {
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
    arguments: args.filter(a => a)
  };
}

function ridPathNode(ctx: Context) {
  return {
    type: "ArrowFunctionExpression",
    params: [
      {
        type: "Identifier",
        name: "$"
      }
    ],
    body: {
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "$"
        },
        property: {
          type: "Identifier",
          name: ctx.document.properties[0].key.name
        }
      },
      property: {
        type: "Identifier",
        name: "_rid"
      }
    }
  };
}

function clone(o: any) {
  return JSON.parse(JSON.stringify(o));
}

function transformWithNewContext(
  contexts: Context[],
  node: { [x: string]: any }
) {
  const ctx = contexts[contexts.length - 1];
  const nextCtx: Context = {
    document: ctx.document ? clone(ctx.document) : null
  };
  contexts.push(nextCtx);
  const transformed = transform(contexts, node);
  contexts.pop();
  return [transformed, nextCtx];
}

const definitions: { [key: string]: Function } = {
  array_constant(
    contexts: Context[],
    { elements }: { elements: any[] }
  ): { type: string; elements: any[] } {
    return {
      type: "ArrayExpression",
      elements: elements.map(v => transform(contexts, v))
    };
  },

  array_subquery_expression(
    contexts: Context[],
    { expression }: { expression: any }
  ) {
    return transformWithNewContext(contexts, expression)[0];
  },

  boolean_constant(contexts: Context[], { value }: { value: boolean }) {
    return {
      type: "BooleanLiteral",
      value
    };
  },

  collection_expression(
    contexts: Context[],
    { expression }: { expression: any }
  ): any {
    return transform(contexts, expression);
  },

  collection_member_expression(
    contexts: Context[],
    {
      object,
      property,
      computed
    }: { object: any; property: any; computed: boolean }
  ) {
    return {
      type: "MemberExpression",
      object: transform(contexts, object),
      property: transform(contexts, property),
      computed
    };
  },

  collection_subquery_expression(
    contexts: Context[],
    { expression }: { expression: any }
  ) {
    return transformWithNewContext(contexts, expression)[0];
  },

  exists_subquery_expression(
    contexts: Context[],
    { expression }: { expression: any }
  ) {
    const rows = transformWithNewContext(contexts, expression)[0];
    return callHelperNode("exists", rows);
  },

  filter_condition(contexts: Context[], { condition }: { condition: any }) {
    const ctx = contexts[contexts.length - 1];
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
          params: ctx.document ? [ctx.document] : [],
          body: strictTrueNode(transform(contexts, condition))
        }
      ]
    };
  },

  from_source(
    contexts: Context[],
    { expression, alias }: { expression: any; alias?: any }
  ) {
    return transform(contexts, alias || expression);
  },

  from_specification(
    contexts: Context[],
    {
      source,
      joins
    }: {
      source: { expression: any; alias?: any; iteration?: boolean };
      joins?: { expression: any; alias?: any; iteration?: boolean }[];
    }
  ) {
    const ctx = contexts[contexts.length - 1];
    return [source, ...(joins || [])].reduce(
      (object, { expression, alias, iteration }, i) => {
        const isSubquery = expression.type === "collection_subquery_expression";
        if (!ctx.highCardinality) {
          ctx.highCardinality = iteration || isSubquery;
        }

        const exp = transform(contexts, expression);
        const aliasNode = alias ? transform(contexts, alias) : null;
        const node = aliasNode || exp;
        const nameNode = !isSubquery
          ? node.property || node
          : aliasNode || { type: "Identifier", name: `$${i}` };

        if (!ctx.document) {
          if (exp.type !== "MemberExpression") {
            ctx.document = exp;
          } else {
            traverse({ type: "Program", body: [exp] } as any, {
              MemberExpression(path: any) {
                const { object: o } = path.node;
                if (o.type === "Identifier") {
                  ctx.document = o;
                  path.stop();
                }
              }
            });
          }
        }

        const { document } = ctx;

        ctx.document = {
          type: "ObjectPattern",
          properties: [
            ...(document.type === "ObjectPattern" ? document.properties : []),
            {
              type: "ObjectProperty",
              computed: false,
              shorthand: true,
              key: nameNode,
              value: nameNode
            }
          ]
        };

        if (iteration || isSubquery) {
          const arrayValue = iteration && isSubquery;
          const mapProps = {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: {
                type: "LogicalExpression",
                left: arrayValue
                  ? {
                      type: "MemberExpression",
                      object: exp,
                      property: {
                        type: "NumericLiteral",
                        value: 0
                      }
                    }
                  : exp,
                operator: "||",
                right: {
                  type: "ArrayExpression",
                  elements: [] as any[]
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
                      : []),
                    {
                      type: "ObjectProperty",
                      computed: false,
                      key: nameNode,
                      value: nameNode
                    }
                  ]
                }
              }
            ]
          };
          if (!object) {
            // e.g.
            //   FROM c
            //   JOIN (SELECT VALUE t FROM t IN c.tags WHERE t.name = 'foo')
            //
            // collection
            //   .reduce(($, c) => [...$, { c }], [])
            //   .reduce(($, { c }) => [
            //     ...$,
            //     ...(c.tag || []).map(t => ({ c, t })).filter(...).map(({ c, t }) => t)
            //   ], [])
            return mapProps;
          }

          // e.g.
          //   FROM Families f
          //   JOIN c IN f.children
          //   JOIN p IN c.pets
          //
          // collection
          //   .reduce(($, Families) => [...$, { f: Families }], [])
          //   .reduce(($, { f }) => [...$, ...(f.children || []).map(c => ({ c, f }))], [])
          //   .reduce(($, { f, c }) => [...$, ...(c.pets || []).map(p => ({ c, f, p }))], [])
          return {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object,
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
                      argument: mapProps
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
        //   FROM Families.children[0] c
        //
        // collection
        //   .reduce(($, Families) => [...$, { c: Families.children[0] }], [])
        //
        //   FROM Families f
        //   JOIN f.children
        //
        // collection
        //   .reduce(($, Families) => [...$, { f: Families }], [])
        //   .reduce(($, f) => (typeof f.children !== 'undefined' ? [...$, { f, children: f.children }] : $), [])
        return {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object,
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
                test: isNotUndefinedNode(exp),
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
                          : []),
                        {
                          type: "ObjectProperty",
                          computed: false,
                          key: nameNode,
                          value: exp
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
      },
      contexts.length === 1 ? ctx.ast : null
    );
  },

  identifier(contexts: Context[], { name }: { name: string }) {
    return {
      type: "Identifier",
      name
    };
  },

  null_constant() {
    return { type: "NullLiteral" };
  },

  number_constant(contexts: Context[], { value }: { value: number }) {
    return {
      type: "NumericLiteral",
      value
    };
  },

  object_constant(
    contexts: Context[],
    { properties }: { properties: { key: any; value: any }[] }
  ) {
    return {
      type: "ObjectExpression",
      properties: properties.map(({ key, value }) => ({
        type: "ObjectProperty",
        key: transform(contexts, key),
        value: transform(contexts, value)
      }))
    };
  },

  object_property_list(
    contexts: Context[],
    { properties }: { properties: { property: any; alias: any }[] }
  ) {
    let n = 0;
    return {
      type: "ObjectExpression",
      properties: properties.map(({ property, alias }) => {
        let key;
        if (alias) {
          key = alias;
        } else if (property.type === "scalar_member_expression") {
          key = property.property;
        } else if (property.type === "identifier") {
          key = property;
        }
        return {
          type: "ObjectProperty",
          key: key
            ? transform(contexts, key)
            : // eslint-disable-next-line no-plusplus
              { type: "Identifier", name: `$${++n}` },
          value: transform(contexts, property)
        };
      })
    };
  },

  parameter_name(contexts: Context[], { name }: { name: string }) {
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

  scalar_array_expression(
    contexts: Context[],
    { elements }: { elements: any[] }
  ) {
    return {
      type: "ArrayExpression",
      elements: elements.map(v => transform(contexts, v))
    };
  },

  scalar_between_expression(
    contexts: Context[],
    { value, begin, end }: { value: any; begin: any; end: any }
  ) {
    const left = transform(contexts, value);
    return {
      type: "BinaryExpression",
      left: {
        type: "BinaryExpression",
        left,
        operator: ">=",
        right: transform(contexts, begin)
      },
      operator: "&&",
      right: {
        type: "BinaryExpression",
        left,
        operator: "<=",
        right: transform(contexts, end)
      }
    };
  },

  scalar_binary_expression(
    contexts: Context[],
    { left, operator, right }: { left: any; operator: string; right: any }
  ) {
    const l = transform(contexts, left);
    const r = transform(contexts, right);

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

    return callHelperNode(
      "calculate",
      {
        type: "StringLiteral",
        value: operator
      },
      l,
      r
    );
  },

  scalar_conditional_expression(
    contexts: Context[],
    {
      test,
      consequent,
      alternate
    }: { test: any; consequent: any; alternate: any }
  ) {
    return {
      type: "ConditionalExpression",
      test: strictTrueNode(transform(contexts, test)),
      consequent: transform(contexts, consequent),
      alternate: transform(contexts, alternate)
    };
  },

  scalar_function_expression(
    contexts: Context[],
    {
      type,
      name,
      arguments: args,
      udf
    }: { type: string; name: any; arguments: any[]; udf: boolean }
  ) {
    const ctx = contexts[contexts.length - 1];
    const aggregation =
      ctx.aggregation && isAggregateFunction({ type, name, udf });

    const f = transform(contexts, name);
    if (!udf) f.name = f.name.toUpperCase();

    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          // eslint-disable-next-line no-nested-ternary
          name: udf ? "udf" : aggregation ? "$a" : "$b"
        },
        property: f
      },
      arguments: aggregation
        ? args.map(a => ({
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: {
                type: "Identifier",
                name: "$__"
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
                body: transform(contexts, a)
              }
            ]
          }))
        : args.map(a => transform(contexts, a))
    };
  },

  scalar_in_expression(
    contexts: Context[],
    { value, list }: { value: any; list: any[] }
  ) {
    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: {
          type: "ArrayExpression",
          elements: list.map(l => transform(contexts, l))
        },
        property: {
          type: "Identifier",
          name: "includes"
        }
      },
      arguments: [transform(contexts, value)]
    };
  },

  scalar_member_expression(
    contexts: Context[],
    {
      object,
      property,
      computed
    }: { object: any; property: any; computed: boolean }
  ) {
    const objectNode = transform(contexts, object);

    return {
      type: "SequenceExpression",
      expressions: [
        {
          type: "AssignmentExpression",
          left: {
            type: "Identifier",
            name: "$_"
          },
          operator: "=",
          right: objectNode
        },
        {
          type: "ConditionalExpression",
          test: {
            type: "LogicalExpression",
            left: {
              type: "BinaryExpression",
              left: {
                type: "UnaryExpression",
                operator: "typeof",
                prefix: true,
                argument: {
                  type: "Identifier",
                  name: "$_"
                }
              },
              operator: "===",
              right: {
                type: "StringLiteral",
                value: "object"
              }
            },
            operator: "&&",
            right: {
              type: "Identifier",
              name: "$_"
            }
          },
          consequent: {
            type: "MemberExpression",
            object: {
              type: "Identifier",
              name: "$_"
            },
            property: transform(contexts, property),
            computed
          },
          alternate: {
            type: "Identifier",
            name: "undefined"
          }
        }
      ]
    };
  },

  scalar_object_expression(
    contexts: Context[],
    { properties }: { properties: any[] }
  ) {
    return {
      type: "ObjectExpression",
      properties: properties.map(({ key, value }) => ({
        type: "ObjectProperty",
        key: transform(contexts, key),
        value: transform(contexts, value)
      }))
    };
  },

  scalar_subquery_expression(
    contexts: Context[],
    { expression }: { expression: any }
  ) {
    const [object, ctx] = transformWithNewContext(contexts, expression);

    if (!ctx.aggregation && ctx.highCardinality) {
      throw new SyntaxError(
        "The cardinality of a scalar subquery result set cannot be greater than one."
      );
    }

    return {
      type: "MemberExpression",
      object,
      property: {
        type: "NumericLiteral",
        value: 0
      }
    };
  },

  scalar_unary_expression(
    contexts: Context[],
    { operator, argument }: { operator: string; argument: any }
  ) {
    const node = transform(contexts, argument);

    if (operator === "NOT") {
      return callHelperNode("not", node);
    }

    return callHelperNode(
      "calculateUnary",
      {
        type: "StringLiteral",
        value: operator
      },
      node
    );
  },

  select_query(
    contexts: Context[],
    {
      top,
      select,
      from,
      where,
      orderBy
    }: { top: any; select: any; from: any; where: any; orderBy: any }
  ) {
    const ctx = contexts[contexts.length - 1];

    if (from) {
      ctx.ast = {
        type: "Identifier",
        name: "$c"
      };
      ctx.ast = transform(contexts, from);
    } else {
      ctx.ast = {
        type: "ArrayExpression",
        elements: [
          contexts.length === 1 || !ctx.document
            ? {
                type: "NullLiteral"
              }
            : clone(ctx.document)
        ]
      };
    }

    if (where) {
      ctx.ast = transform(contexts, where);
    }

    if (orderBy) {
      ctx.ast = transform(contexts, orderBy);
    } else if (contexts.length === 1 && ctx.document) {
      // try sort by `_rid` when `FROM` is specified
      ctx.ast = callHelperNode("sort", ctx.ast, ridPathNode(ctx));
    }

    if (top) {
      ctx.ast = transform(contexts, top);
    }

    return transform(contexts, select);
  },

  select_specification(
    contexts: Context[],
    {
      "*": all,
      properties,
      value
    }: { "*": boolean; properties?: { properties: any[] }; value: any }
  ) {
    const ctx = contexts[contexts.length - 1];
    if (properties) {
      ctx.aggregation = properties.properties.some(({ property }) =>
        isAggregateFunction(property)
      );
    } else {
      ctx.aggregation = value ? isAggregateFunction(value) : false;
    }

    if (ctx.aggregation) {
      // ```
      // (
      //   $__ = $c.filter(...),
      //   [{ $1: COUNT($__.map(c => c.id)), $2: ... }]
      // )
      // ```
      return {
        type: "SequenceExpression",
        expressions: [
          // cache filtered result to a variable
          {
            type: "AssignmentExpression",
            left: {
              type: "Identifier",
              name: "$__"
            },
            operator: "=",
            right: ctx.ast
          },
          {
            type: "ArrayExpression",
            elements: [transform(contexts, properties || value)]
          }
        ]
      };
    }

    if (all) {
      if (!ctx.document) {
        throw new SyntaxError(
          "'SELECT *' is not valid if FROM clause is omitted."
        );
      }
      if (ctx.document.properties.length > 1) {
        throw new SyntaxError(
          "'SELECT *' is only valid with a single input set."
        );
      }
    }

    if (!ctx.document) {
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
            params: [] as any[],
            body: transform(contexts, properties || value)
          }
        ]
      };
    }

    const select = all
      ? ctx.document.properties[0]
      : transform(contexts, properties || value);

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
          body:
            contexts.length === 1
              ? {
                  type: "ArrayExpression",
                  elements: [select, ctx.document]
                }
              : select
        }
      ]
    };
  },

  sort_specification(
    contexts: Context[],
    { expressions }: { expressions: any[] }
  ) {
    if (expressions.length > 1) {
      throw new SyntaxError(
        "Multiple order-by items are not supported. Please specify a single order-by items."
      );
    }

    const ctx = contexts[contexts.length - 1];
    ctx.orderBy = transform(contexts, expressions[0]);

    return callHelperNode("sort", ctx.ast, ridPathNode(ctx), ctx.orderBy);
  },

  sort_expression(
    contexts: Context[],
    { expression, order }: { expression: any; order: string }
  ) {
    if (expression.type !== "scalar_member_expression") {
      throw new SyntaxError(
        "Unsupported ORDER BY clause. ORDER BY item expression could not be mapped to a document path."
      );
    }

    const ctx = contexts[contexts.length - 1];
    const node = transform(contexts, expression);

    return {
      type: "ArrayExpression",
      elements: [
        {
          type: "ArrowFunctionExpression",
          params: [ctx.document],
          body: node
        },
        {
          type: "BooleanLiteral",
          value: order === "DESC"
        }
      ]
    };
  },

  sql(contexts: Context[], { body }: { body: any }) {
    const ctx: Context = {};
    contexts.push(ctx);
    const node = transform(contexts, body);

    let returnNode;
    if (!ctx.document || ctx.aggregation) {
      returnNode = {
        type: "ObjectExpression",
        properties: [
          {
            type: "ObjectProperty",
            computed: false,
            shorthand: false,
            kind: "init",
            key: {
              type: "Identifier",
              name: "result"
            },
            value: callHelperNode("stripUndefined", node)
          },
          {
            type: "ObjectProperty",
            computed: false,
            shorthand: false,
            kind: "init",
            key: {
              type: "Identifier",
              name: "continuation"
            },
            value: { type: "NullLiteral" }
          }
        ]
      };
    } else {
      returnNode = callHelperNode(
        "paginate",
        node,
        { type: "Identifier", name: "$maxItemCount" },
        { type: "Identifier", name: "$continuation" },
        ridPathNode(ctx),
        ctx.orderBy
      );
    }

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
        // udf
        {
          type: "Identifier",
          name: "udf"
        },
        // parameters
        {
          type: "Identifier",
          name: "$p"
        },
        {
          type: "Identifier",
          name: "$maxItemCount"
        },
        {
          type: "Identifier",
          name: "$continuation"
        },
        // temporal cache
        {
          type: "Identifier",
          name: "$_"
        },
        // intermediate cache
        {
          type: "Identifier",
          name: "$__"
        }
      ],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ReturnStatement",
            argument: returnNode
          }
        ]
      }
    };
  },

  string_constant(contexts: Context[], { value }: { value: string }) {
    return {
      type: "StringLiteral",
      value
    };
  },

  top_specification(contexts: Context[], { value }: { value: any }) {
    const ctx = contexts[contexts.length - 1];
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
        transform(contexts, value)
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

export default (sqlAst: { [x: string]: any }) => transform([], sqlAst);
