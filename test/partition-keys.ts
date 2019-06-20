import testPartitionKeys from "./utils/test-partition-keys";

export const contains = testPartitionKeys("SELECT * FROM c WHERE c.key = 1", [
  "/key"
]);

export const notContain = testPartitionKeys("SELECT * FROM c", ["/key"], false);

export const containsAndExpression = testPartitionKeys(
  "SELECT * FROM c WHERE c.key = 1 AND c.foo = 2",
  ["/key"]
);

export const notContainsOrExpression = testPartitionKeys(
  "SELECT * FROM c WHERE c.key = 1 OR c.foo = 2",
  ["/key"],
  false
);

export const containsAndOrExpression = testPartitionKeys(
  "SELECT * FROM c WHERE c.key = 1 OR (c.key = 2 AND c.foo = 3)",
  ["/key"]
);

export const notContainsAndOrExpression = testPartitionKeys(
  "SELECT * FROM c WHERE (c.key = 1 AND c.foo = 2) OR c.bar = 3",
  ["/key"],
  false
);

export const containsNestedKey = testPartitionKeys(
  "SELECT * FROM c WHERE c.foo.bar = 1",
  ["/foo/bar"]
);

export const containsMultipleKeys = testPartitionKeys(
  "SELECT * FROM c WHERE c.foo = 1 AND c.bar = 2",
  ["/foo", "/bar"]
);

export const notContainsMultipleKeys = testPartitionKeys(
  "SELECT * FROM c WHERE c.foo = 1 OR c.bar = 2",
  ["/foo", "/bar"],
  false
);

export const empty = testPartitionKeys("SELECT * FROM c", []);
