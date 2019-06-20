import * as assert from "assert";
import query from "../../lib";

export default (q: string, keys: string[], expected: boolean = true) => () => {
  const result = query(q).containsPartitionKeys(keys);
  assert.strictEqual(result, expected);
};
