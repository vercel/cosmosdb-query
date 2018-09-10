// @flow
const testQuery = require("./utils/test-query");

exports.root = testQuery(
  [
    {
      id: 1,
      ts: 1
    },
    {
      id: 2,
      ts: 2
    },
    {
      id: 3,
      is: 3
    }
  ],
  {
    query: "SELECT * FROM c WHERE c.ts < @a AND c.ts > @b",
    parameters: [{ name: "@a", value: "3" }, { name: "@b", value: "1" }]
  },
  [
    {
      id: 2,
      ts: 2
    }
  ]
);
