# cosmosdb-query

A SQL parser and executer for Cosmos DB.

```js
const { default: query } = require("@zeit/cosmosdb-query");

const collection = [
  { id: "foo" },
  { id: "bar" }
];

const docs = query("SELECT * FROM c WHERE c.id = @id")
  .exec(collection, {
    parameters: [{ name: "@id", value: "foo" }]
  });
console.log(docs); // [ { id: "foo" } ]
```

### query(sql)

- `sql` &lt;string>
- Returns: &lt;Query>

```js
const q = query("SELECT * FROM c")
```

## Class: Query

### q.exec(collection[, options])

- `collection` &lt;Object[]> | &lt;null>
- `options` &lt;Object>
  - `parameters` &lt;Object[]> The parameters to pass to query
  - `udf` &lt;Object>
- Returns: &lt;Object[]>


Executes query for `collection`.

```js
query(`SELECT VALUE udf.REGEX_MATCH("foobar", ".*bar")`).exec(null, {
  udf: {
    REGEX_MATCH(input, pattern) {
      return input.match(pattern) !== null
    }
  }
});
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


## Supported queries

All queries are supported except spatial functions
