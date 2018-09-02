// @flow
const assert = require("assert");
const query = require("../../lib");

module.exports = (
  q: string,
  keys: string[],
  expected: boolean = true
) => () => {
  const result = query(q).containsPartitionKeys(keys);
  assert.strictEqual(result, expected);
};
