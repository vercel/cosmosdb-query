// @flow
const assert = require("assert");
const query = require("../../lib");

module.exports = (
  collection: ?(any[]),
  params: {
    query: string,
    parameters?: { name: string, value: any }[]
  },
  expected: any[] | Error
) => () => {
  if (expected instanceof Error) {
    const e = (expected: Error);
    assert.throws(
      () => {
        query(params.query).exec(collection, params.parameters);
      },
      err => err.message === e.message && err.name === e.name
    );
    return;
  }

  const docs = query(params.query).exec(collection, params.parameters);
  assert.deepStrictEqual(docs, expected);
};
