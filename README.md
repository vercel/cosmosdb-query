# cosmosdb-query

A SQL parser and executer for Cosmos DB.

```js
const { default: query } = require("@zeit/cosmosdb-query");

const items = [
  { id: "foo" },
  { id: "bar" }
];

const { result } = query("SELECT * FROM c WHERE c.id = @id")
  .exec(items, {
    parameters: [{ name: "@id", value: "foo" }]
  });
console.log(result); // [ { id: "foo" } ]
```

### query(sql)

- `sql` &lt;string>
- Returns: &lt;Query>

```js
const q = query("SELECT * FROM c")
```

## Class: Query

### q.exec(items[, options])

- `items` &lt;Object[]> | &lt;null>
- `options` &lt;Object>
  - `parameters` &lt;Object[]> The parameters to pass to query
  - `udf` &lt;Object>
  - `maxItemCount` &lt;number> The number of items to return at a time
  - `continuation` &lt;Object> Continuation token
  - `compositeIndexes `&lt;Object[][]> Optional composite index definitions for validating multiple `ORDER BY` properties. By default, no definition is required and this value is used only for validation.
- Returns: &lt;Object>
  - `result` &lt;Object[]> Result documents
  - `continuation` &lt;Object> Continuation token for subsequent calls


Executes a query for `items`.

```js
query(`SELECT VALUE udf.REGEX_MATCH("foobar", ".*bar")`).exec([], {
  udf: {
    REGEX_MATCH(input, pattern) {
      return input.match(pattern) !== null
    }
  }
});
```

When the `maxItemCount` and/or `continuation` options are used,
all itesms have to contain the `_rid` field with unique values.

```js
const items = [
  { _rid: "a", value: 1 },
  { _rid: "b", value: 2 },
  { _rid: "c", value: 3 }
];
const q = query(`SELECT * FROM c`);
const { result, continuation } = q.exec(items, { maxItemCount: 2 });
console.log(result); // [ { _rid: "a", value: 1 }, { _rid: "b", value: 2 } ]

const { result: result2 } = q.exec(items, { maxItemCount: 2, continuation });
console.log(result2); // [ { _rid: "c", value: 3 } ]
```

### q.containsPartitionKeys(keys)

- `keys` &lt;string[]>
- Returns: &lt;boolean>


Determines whether query may contain partition keys.

```js
const q = query("SELECT * FROM c WHERE c.id = 1");
if (!q.containsPartitionKeys(["/key"])) {
  throw new Error("query doesn't contain partition keys");
}
```

### q.ast

- &lt;Object>

The AST object of query.

## Class: SyntaxError

```js
const { default: query, SyntaxError } = require("@zeit/cosmosdb-query");

try {
  query("INVALID SELECT").exec(items);
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error(err);
  }
  throw err;
}
```

## Supported queries

All queries are supported except spatial functions `ST_ISVALID` and `ST_ISVALIDDETAILED`.

The spatial functions `ST_INTERSECTS`, `ST_WITHIN`, and `ST_DISTANCE` are supported; use parameters to pass in GeoJSON as strings. Items in collections that are GeoJSON are expected to be of type string.




