// @flow
const assert = require("assert");
const query = require("../../lib");

module.exports = (
  collection: ?(any[]),
  params: {
    query: string,
    parameters?: { name: string, value: any }[]
  },
  expected: any[]
) => () => {
  const docs = query(params.query).exec(collection, params.parameters);
  assert.deepStrictEqual(docs, expected);
};
