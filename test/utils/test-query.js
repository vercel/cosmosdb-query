// @flow
const assert = require("assert");
const query = require("../../lib");

module.exports = (
  collection: ?(any[]),
  params: {
    query: string,
    parameters?: { name: string, value: any }[],
    udf?: Object
  },
  expected: any[] | Error | Object
) => () => {
  const opts = {
    parameters: params.parameters,
    udf: params.udf
  };

  if (expected instanceof Error || expected.prototype instanceof Error) {
    assert.throws(
      () => query(params.query).exec(collection, opts),
      err => {
        if (expected instanceof Error) {
          const e = (expected: Error);
          return err.message === e.message && err.name === e.name;
        }
        // $FlowFixMe
        return err instanceof expected || err.name === expected.name;
      }
    );
    return;
  }

  const docs = query(params.query).exec(collection, opts);
  assert.deepStrictEqual(docs, expected);
};
