# cosmosdb-query

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
