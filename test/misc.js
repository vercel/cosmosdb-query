// @flow
const testQuery = require("./utils/test-query");

exports.root = testQuery(
  [{ id: "sample database" }],
  {
    query: "select * from root r where r.id=@id",
    parameters: [{ name: "@id", value: "sample database" }]
  },
  [{ id: "sample database" }]
);

exports.compareGreaterAndLess = testQuery(
  [{ id: "a", deletedAt: 10 }, { id: "b", deletedAt: 20 }],
  {
    query: "select * from c WHERE c.deletedAt < @a AND c.deletedAt > @b",
    parameters: [{ name: "@a", value: 15 }, { name: "@b", value: 5 }]
  },
  [{ id: "a", deletedAt: 10 }]
);

exports.topMoreThan10 = testQuery(
  [{ id: "b" }, { id: "c" }, { id: "a" }],
  {
    query: "select top 123 * from c order by c.id"
  },
  [{ id: "a" }, { id: "b" }, { id: "c" }]
);

exports.parameterizedTop = testQuery(
  [{ id: "b" }, { id: "c" }, { id: "a" }],
  {
    query: "select top @top * from c order by c.id",
    parameters: [{ name: "@top", value: 1 }]
  },
  [{ id: "a" }]
);

exports.conditionStrictTrue1 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where true"
  },
  [{ id: "hi" }]
);

exports.conditionStrictTrue2 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1 OR true"
  },
  [{ id: "hi" }]
);

exports.conditionNotStrictTrue1 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1"
  },
  []
);

exports.conditionNotStrictTrue2 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1 and true"
  },
  []
);

exports.conditionNotStrictTrue3 = testQuery(
  [{ id: "hi" }],
  {
    query: "select * from c where 1 OR 'ok'"
  },
  []
);

exports.equal = testQuery(
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

exports.equalUndefined = testQuery(
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
  [{}]
);

exports.notEqualUndefined = testQuery(
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
  [{}]
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
