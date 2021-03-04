import testQuery from "./utils/test-query";

export const root = testQuery(
  [{ id: "sample database" }],
  {
    query: "select * from root r where r.id=@id",
    parameters: [{ name: "@id", value: "sample database" }]
  },
  [{ id: "sample database" }]
);

export const compareGreaterAndLess = testQuery(
  [{ id: "a", deletedAt: 10 }, { id: "b", deletedAt: 20 }],
  {
    query: "select * from c WHERE c.deletedAt < @a AND c.deletedAt > @b",
    parameters: [{ name: "@a", value: 15 }, { name: "@b", value: 5 }]
  },
  [{ id: "a", deletedAt: 10 }]
);

export const topMoreThan10 = testQuery(
  [{ id: "b" }, { id: "c" }, { id: "a" }],
  {
    query: "select top 123 * from c order by c.id"
  },
  [{ id: "a" }, { id: "b" }, { id: "c" }]
);

export const parameterizedTop = testQuery(
  [{ id: "b" }, { id: "c" }, { id: "a" }],
  {
    query: "select top @top * from c order by c.id",
    parameters: [{ name: "@top", value: 1 }]
  },
  [{ id: "a" }]
);

export const conditionStrictTrue1 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where true"
  },
  [{ id: "hi" }]
);

export const conditionStrictTrue2 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1 OR true"
  },
  [{ id: "hi" }]
);

export const conditionNotStrictTrue1 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1"
  },
  []
);

export const conditionNotStrictTrue2 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1 and true"
  },
  []
);

export const conditionNotStrictTrue3 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1 OR 'ok'"
  },
  []
);

export const equal = testQuery(
  null,
  {
    query: `
      select
        null = null,
        {} = {},
        { hi: undefined } = { hi: undefined },
        { foo: { bar: {} } } = { foo: { bar: {} } },
        { foo: 1, bar: 2 } = { bar: 2, foo: 1 },
        { foo: 1, bar: 2 } = { foo: 1, bar: '2' },
        { foo: 1, bar: 2 } = { foo: 1, bar: 2, baz: 3 },
        [] = [],
        [undefined] = [undefined],
        [[1]] = [[1]],
        [1, 2] = [1, 2],
        [1, 2] = [1, '2'],
        [1, 2] = [1, 2, 3],
        [{foo: [{bar: true}]}] = [{foo:[{bar: true}]}],
        [{foo: [{bar: true}]}] = [{foo:[{bar: false}]}]
    `
  },
  [
    {
      $1: true,
      $2: true,
      $3: true,
      $4: true,
      $5: true,
      $6: false,
      $7: false,
      $8: true,
      $9: true,
      $10: true,
      $11: true,
      $12: false,
      $13: false,
      $14: true,
      $15: false
    }
  ]
);

export const equalUndefined = testQuery(
  [{ id: "hi" }],
  {
    query: `
      select
        c.nonExist = c.nonExist,
        undefined = undefined,
        undefined = 0,
        undefined = null,
        null = 0,
        false = 0,
        true = 1,
        1 = "1",
        {} = null,
        {} = []
      from c
    `
  },
  [
    {
      $5: false,
      $6: false,
      $7: false,
      $8: false,
      $9: false,
      $10: false
    }
  ]
);

export const notEqualUndefined = testQuery(
  [{ id: "hi" }],
  {
    query: `
      select
        c.nonExist != c.nonExist,
        undefined != undefined,
        undefined != 0,
        undefined != null,
        null != 0,
        false != 0,
        true != 1,
        1 != "1",
        {} != null,
        {} != []
      from c
    `
  },
  [
    {
      $5: true,
      $6: true,
      $7: true,
      $8: true,
      $9: true,
      $10: true
    }
  ]
);

[">", "<", ">=", "<="].forEach(op => {
  exports[`compareUndefined ${op}`] = testQuery(
    [{ id: "hi" }],
    {
      query: `
        select
          c.nonExist ${op} c.nonExist,
          undefined ${op} undefined,
          undefined ${op} null,
          1 ${op} false,
          0 ${op} '1',
          null ${op} 0,
          1 ${op} "1",
          {} ${op} {},
          [] ${op} []
        from c
      `
    },
    [{}]
  );
});

export const logicalOrOperator = testQuery(
  null,
  {
    query: `
      select
        true or undefined,
        undefined or true,
        null or true,
        0 or true,
        '' or true,
        {} or true,
        [] or true
    `
  },
  [
    {
      $1: true,
      $2: true,
      $3: true,
      $4: true,
      $5: true,
      $6: true,
      $7: true
    }
  ]
);

export const logicalOrOperatorUndefined = testQuery(
  null,
  {
    query: `
      select
        false or undefined,
        undefined or false,
        0 or false,
        '' or false,
        {} or false,
        [] or false,
        undefined or undefined,
        null or undefined,
        0 or undefined,
        '' or undefined,
        {} or undefined,
        [] or undefined
    `
  },
  [{}]
);

export const logicalAndOperator = testQuery(
  null,
  {
    query: `
      select
        false and undefined,
        undefined and false,
        null and false,
        0 and false,
        '' and false,
        {} and false,
        [] and false
    `
  },
  [
    {
      $1: false,
      $2: false,
      $3: false,
      $4: false,
      $5: false,
      $6: false,
      $7: false
    }
  ]
);

export const logicalAndOperatorUndefined = testQuery(
  null,
  {
    query: `
      select
        true and undefined,
        undefined and true,
        0 and true,
        '' and true,
        {} and true,
        [] and true,
        undefined and undefined,
        null and undefined,
        0 and undefined,
        '' and undefined,
        {} and undefined,
        [] and undefined
    `
  },
  [{}]
);

export const logicalNotOperatorUndefined = testQuery(
  null,
  {
    query: `
      select
        not undefined,
        not null,
        not 0,
        not '',
        not {},
        not []
    `
  },
  [{}]
);

export const ternaryOperator = testQuery(
  null,
  {
    query: `
      select
        true ? true : false,
        null ? true : false,
        1 ? true : false,
        'str' ? true : false,
        {} ? true : false,
        [] ? true : false
    `
  },
  [
    {
      $1: true,
      $2: false,
      $3: false,
      $4: false,
      $5: false,
      $6: false
    }
  ]
);

export const concatenateOperator = testQuery(
  null,
  {
    query: `
      select
        "foo" || "bar",
        "foo" || 0,
        0 || "bar",
        undefined || "bar",
        null || "bar",
        true || "bar",
        {} || "bar",
        [] || "bar"
    `
  },
  [
    {
      $1: "foobar"
    }
  ]
);

["+", "-", "*", "/", "%", "|", "&", "^", "<<", ">>", ">>>"].forEach(op => {
  exports[`arithmeticOperatorUndefined ${op}`] = testQuery(
    null,
    {
      query: `
        select
          0 ${op} undefined,
          0 ${op} null,
          0 ${op} true,
          0 ${op} '1',
          0 ${op} {},
          0 ${op} [],
          undefined ${op} 1,
          null ${op} 1,
          true ${op} 1,
          '1' ${op} 1,
          {} ${op} 1,
          [] ${op} 1
      `
    },
    [{}]
  );
});

["+", "-", "~"].forEach(op => {
  exports[`arithmeticOperatorUndefined ${op}`] = testQuery(
    null,
    {
      query: `
        select
          ${op}undefined,
          ${op}null,
          ${op}'0',
          ${op}true,
          ${op}false,
          ${op}{},
          ${op}[]
      `
    },
    [{}]
  );
});

export const functionCall = testQuery(
  null,
  {
    query: "select ABS(-1), abs(-1), abs (-1), abs ( -1 )"
  },
  [
    {
      $1: 1,
      $2: 1,
      $3: 1,
      $4: 1
    }
  ]
);

export const arrayContains = testQuery(
  null,
  {
    query: `
      select
        array_contains([], null),
        array_contains([[1, 2]], [1], true),
        array_contains([[{foo:1, bar:2}]], [{foo:1}], true),
        array_contains([{foo: { a: 1, b: 2}, bar: 2}], {foo: { a: 1}}, true)
    `
  },
  [
    {
      $1: false,
      $2: false,
      $3: true,
      $4: true
    }
  ]
);

export const orderTypes = testQuery(
  [
    10,
    1,
    0,
    "2",
    0.5,
    "b",
    "1",
    2,
    "10",
    "01",
    false,
    "A",
    [],
    "B",
    "a",
    [2],
    [1],
    {},
    { hi: 2 },
    true,
    { hi: 1 },
    null,
    undefined
  ].map((v, i) => ({ id: i, v })),
  {
    query: "select value c.v from c order by c.v"
  },
  [
    false,
    true,
    null,
    "01",
    "1",
    "10",
    "2",
    "A",
    "B",
    "a",
    "b",
    0,
    0.5,
    1,
    2,
    10
  ]
);

export const aggregationWithUndefined = testQuery(
  [10, 1, 0, 0.5, 2, undefined].map((v, i) => ({ id: i, v })),
  {
    query: `
      select
        count(c.v),
        sum(c.v),
        avg(c.v),
        max(c.v),
        min(c.v)
      from c
    `
  },
  [
    {
      $1: 5,
      $2: 13.5,
      $3: 2.7,
      $4: 10,
      $5: 0
    }
  ]
);

export const aggregationWithNull = testQuery(
  [10, 1, 0, 0.5, 2, null].map((v, i) => ({ id: i, v })),
  {
    query: `
      select
        count(c.v),
        sum(c.v),
        avg(c.v),
        max(c.v),
        min(c.v)
      from c
    `
  },
  [
    {
      $1: 6,
      $4: 10,
      $5: null
    }
  ]
);

export const aggregationWithBoolean = testQuery(
  [10, 1, 0, 0.5, 2, true, false].map((v, i) => ({ id: i, v })),
  {
    query: `
      select
        count(c.v),
        sum(c.v),
        avg(c.v),
        max(c.v),
        min(c.v)
      from c
    `
  },
  [
    {
      $1: 7,
      $4: 10,
      $5: false
    }
  ]
);

export const aggregationWithString = testQuery(
  [10, 1, 0, 0.5, 2, "01", "1", "10", "2", "A", "B", "a", "b"].map((v, i) => ({
    id: i,
    v
  })),
  {
    query: `
      select
        count(c.v),
        sum(c.v),
        avg(c.v),
        max(c.v),
        min(c.v)
      from c
    `
  },
  [
    {
      $1: 13,
      $4: "b",
      $5: 0
    }
  ]
);

export const aggregationWithArrayAndObject = testQuery(
  [10, 1, 0, 0.5, 2, [], {}].map((v, i) => ({
    id: i,
    v
  })),
  {
    query: `
      select
        count(c.v),
        sum(c.v),
        avg(c.v),
        max(c.v),
        min(c.v)
      from c
    `
  },
  [
    {
      $1: 7
    }
  ]
);

export const aggregationEmpty = testQuery(
  [],
  {
    query: `
      select
        count(c.v),
        sum(c.v),
        avg(c.v),
        max(c.v),
        min(c.v)
      from c
    `
  },
  [
    {
      $1: 0,
      $2: 0
    }
  ]
);

export const functionWithParameters = testQuery(
  [{ id: "foo", name: "foo" }, { id: "bar", name: "bar" }],
  {
    query: "select * from c where ARRAY_CONTAINS(@names, c.name)",
    parameters: [{ name: "@names", value: ["foo"] }]
  },
  [{ id: "foo", name: "foo" }]
);

export const withEmptyNestedProperty = testQuery(
  [
    { id: "foo", child: { name: "foo" } },
    { id: "bar", child: null },
    { id: "baz" }
  ],
  {
    query: "select * from c where c.child.name = @name",
    parameters: [{ name: "@name", value: "foo" }]
  },
  [{ id: "foo", child: { name: "foo" } }]
);

export const selectWithEmptyNestedProperty = testQuery(
  [
    { id: "foo", child: { name: "foo" } },
    { id: "bar", child: null },
    { id: "baz" }
  ],
  {
    query: "select c.child.name from c"
  },
  [{ name: "foo" }, {}, {}]
);

export const orderByWithEmptyNestedProperty = testQuery(
  [
    { id: "foo", child: { name: "foo" } },
    { id: "bar", child: null },
    { id: "baz" }
  ],
  {
    query: "select * from c order by c.child.name",
    parameters: [{ name: "@name", value: "foo" }]
  },
  [{ id: "foo", child: { name: "foo" } }]
);

export const deeplyNestedProperty = testQuery(
  [
    { id: "foo", child: { grandchild: { greatgrandchild: { name: "foo" } } } },
    { id: "bar", child: { grandchild: null } }
  ],
  {
    query:
      "select * from c where c.child.grandchild.greatgrandchild.name = @name",
    parameters: [{ name: "@name", value: "foo" }]
  },
  [{ id: "foo", child: { grandchild: { greatgrandchild: { name: "foo" } } } }]
);

export const conditionPropWithParameter = testQuery(
  [
    { id: "foo", name: "foo" },
    { id: "bar", name: "bar" },
    { id: "baz", name: "baz" }
  ],
  {
    query: "select * from c where c[@prop] = 'foo'",
    parameters: [{ name: "@prop", value: "name" }]
  },
  [{ id: "foo", name: "foo" }]
);

export const orderByWithParameter = testQuery(
  [
    { id: "foo", name: "foo" },
    { id: "bar", name: "bar" },
    { id: "baz", name: "baz" }
  ],
  {
    query: "select * from c order by c[@prop]",
    parameters: [{ name: "@prop", value: "name" }]
  },
  [
    { id: "bar", name: "bar" },
    { id: "baz", name: "baz" },
    { id: "foo", name: "foo" }
  ]
);

export const notEqualDifferentType = testQuery(
  [{ id: "javi", foo: null }],
  {
    query: "select * from c where c.id = @id AND c.foo != 'test'",
    parameters: [{ name: "@id", value: "javi" }]
  },
  [{ id: "javi", foo: null }]
);

export const multipleOrderBy = testQuery(
  [
    { id: "id1", sortKey1: "a", sortKey2: "a" },
    { id: "id2", sortKey1: "a", sortKey2: "b" },
    { id: "id3", sortKey1: "b", sortKey2: "a" },
    { id: "id4", sortKey1: "b", sortKey2: "b" }
  ],
  {
    query: "select * from c order by c.sortKey1, c.sortKey2 DESC"
  },
  [
    { id: "id2", sortKey1: "a", sortKey2: "b" },
    { id: "id1", sortKey1: "a", sortKey2: "a" },
    { id: "id4", sortKey1: "b", sortKey2: "b" },
    { id: "id3", sortKey1: "b", sortKey2: "a" }
  ]
);
