# cosmosdb-query

![CircleCI](https://circleci.com/gh/zeit/cosmosdb-query.svg?style=svg&circle-token=9e222857e204b02378b95ed119a319c0e17223d2)

```js
const query = require('@zeit/cosmosdb-query')
const collection = [
  { id: 'foo' },
  { id: 'bar' }
]
const docs = query(collection, {
  query: 'SELECT * FROM c WHERE c.id = @id',
  parameters: [{ name: '@id', value: 'foo' }]
})
console.log(docs) // [ { id: 'foo' } ]
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
