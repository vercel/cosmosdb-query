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
