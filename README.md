# cosmosdb-query

![CircleCI](https://circleci.com/gh/zeit/cosmosdb-query.svg?style=svg&circle-token=9e222857e204b02378b95ed119a319c0e17223d2)

This module is experimental, vulnerable and slow. Not intended to be used on production.

```js
const query = require('@zeit/cosmosdb-query')

const collection = [
  { id: 'foo' },
  { id: 'bar' }
]

const docs = query('SELECT * FROM c WHERE c.id = @id')
  .exec(collection, [{ name: '@id', value: 'foo' }])
console.log(docs) // [ { id: 'foo' } ]

q = query('SELECT * FROM c WHERE c.id = 1')
if (!q.containsPartitionKeys(['/key'])) {
  throw new Error('query doesn\'t contain partition keys')
}
```

## TODO

- Aggregate functions
- BETWEEN keyword
- TOP operator
- VALUE keyword
- JOIN keyword
- IN keyword
- Built-in functions
- Object constant
- Array constant
- Coalesce operator
- User-defined functions
