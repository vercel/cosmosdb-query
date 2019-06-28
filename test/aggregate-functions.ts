// test examples on https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-sql-query-reference#bk_built_in_functions

import testQuery from "./utils/test-query";

const fixtures = [
  { key: null },
  { key: false },
  { key: true },
  { key: "abc" },
  { key: "cdfg" },
  { key: "opqrs" },
  { key: "ttttttt" },
  { key: "xyz" },
  { key: "oo" },
  { key: "ppp" },
  {
    key: "uniquePartitionKey",
    resourceId: "0",
    field: "1"
  },
  {
    key: "uniquePartitionKey",
    resourceId: "1",
    field: "2"
  },
  { key: 1 },
  { key: 2 },
  { key: 3 },
  { key: 4 },
  { key: 5 },
  { key: 6 },
  { key: 7 },
  { key: 8 },
  { key: 9 }
];

export const max = testQuery(
  fixtures,
  { query: "SELECT VALUE MAX(r.key) FROM r" },
  ["xyz"]
);

export const maxBooleanAndNull = testQuery(
  [{ key: null }, { key: false }],
  { query: "SELECT VALUE MAX(r.key) FROM r" },
  [false]
);

export const maxBooleans = testQuery(
  [{ key: false }, { key: true }],
  { query: "SELECT VALUE MAX(r.key) FROM r" },
  [true]
);

export const maxNumbersAndBoolean = testQuery(
  [{ key: 0 }, { key: 1 }, { key: true }],
  { query: "SELECT VALUE MAX(r.key) FROM r" },
  [1]
);

export const min = testQuery(
  fixtures,
  { query: "SELECT VALUE MIN(r.key) FROM r" },
  [null]
);

export const minBooleans = testQuery(
  [{ key: false }, { key: true }],
  { query: "SELECT VALUE MIN(r.key) FROM r" },
  [false]
);

export const minNumbers = testQuery(
  [{ key: 1 }, { key: 2 }],
  { query: "SELECT VALUE MIN(r.key) FROM r" },
  [1]
);

export const minStringAndNumber = testQuery(
  [{ key: "hi" }, { key: 123 }],
  { query: "SELECT VALUE MIN(r.key) FROM r" },
  [123]
);
