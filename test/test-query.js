// @flow
const assert = require("assert");
const query = require("../lib");

module.exports = (
  collection: any[],
  params: {
    query: string,
    parameters?: { name: string, value: string | number }[]
  },
  expected: any[]
) => () => {
  const docs = query(collection, params);
  assert.deepStrictEqual(docs, expected);
};
