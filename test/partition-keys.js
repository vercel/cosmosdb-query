// @flow
const testPartitionKeys = require("./utils/test-partition-keys");

exports.contains = testPartitionKeys("SELECT * FROM c WHERE c.key = 1", [
  "/key"
]);

exports.notContain = testPartitionKeys("SELECT * FROM c", ["/key"], false);

exports.containsAndExpression = testPartitionKeys(
  "SELECT * FROM c WHERE c.key = 1 AND c.foo = 2",
  ["/key"]
);

exports.notContainsOrExpression = testPartitionKeys(
  "SELECT * FROM c WHERE c.key = 1 OR c.foo = 2",
  ["/key"],
  false
);

exports.containsAndOrExpression = testPartitionKeys(
  "SELECT * FROM c WHERE c.key = 1 OR (c.key = 2 AND c.foo = 3)",
  ["/key"]
);

exports.notContainsAndOrExpression = testPartitionKeys(
  "SELECT * FROM c WHERE (c.key = 1 AND c.foo = 2) OR c.bar = 3",
  ["/key"],
  false
);

exports.containsNestedKey = testPartitionKeys(
  "SELECT * FROM c WHERE c.foo.bar = 1",
  ["/foo/bar"]
);

exports.containsMultipleKeys = testPartitionKeys(
  "SELECT * FROM c WHERE c.foo = 1 AND c.bar = 2",
  ["/foo", "/bar"]
);

exports.notContainsMultipleKeys = testPartitionKeys(
  "SELECT * FROM c WHERE c.foo = 1 OR c.bar = 2",
  ["/foo", "/bar"],
  false
);
