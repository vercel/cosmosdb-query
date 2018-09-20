// @flow
// test examples on https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-sql-query

const testQuery = require("./utils/test-query");

const collection = [
  {
    id: "AndersenFamily",
    lastName: "Andersen",
    parents: [{ firstName: "Thomas" }, { firstName: "Mary Kay" }],
    children: [
      {
        firstName: "Henriette Thaulow",
        gender: "female",
        grade: 5,
        pets: [{ givenName: "Fluffy" }]
      }
    ],
    address: { state: "WA", county: "King", city: "seattle" },
    creationDate: 1431620472,
    isRegistered: true
  },

  {
    id: "WakefieldFamily",
    parents: [
      { familyName: "Wakefield", givenName: "Robin" },
      { familyName: "Miller", givenName: "Ben" }
    ],
    children: [
      {
        familyName: "Merriam",
        givenName: "Jesse",
        gender: "female",
        grade: 1,
        pets: [{ givenName: "Goofy" }, { givenName: "Shadow" }]
      },
      {
        familyName: "Miller",
        givenName: "Lisa",
        gender: "female",
        grade: 8
      }
    ],
    address: { state: "NY", county: "Manhattan", city: "NY" },
    creationDate: 1431620462,
    isRegistered: false
  }
];

exports.all = testQuery(collection, { query: "SELECT * FROM c" }, collection);

exports.filterById = testQuery(
  collection,
  { query: 'SELECT * FROM Families f WHERE f.id = "WakefieldFamily"' },
  collection.filter(({ id }) => id === "WakefieldFamily")
);

exports.reformatJSONObject = testQuery(
  collection,
  {
    query: `
      SELECT {"Name":f.id, "City":f.address.city} AS Family
      FROM Families f
      WHERE f.address.city = f.address.state
    `
  },
  collection
    .filter(({ address }) => address.city === address.state)
    .map(({ id, address }) => ({ Family: { Name: id, City: address.city } }))
);

exports.select = testQuery(
  collection,
  { query: 'SELECT f.address FROM Families f WHERE f.id = "AndersenFamily"' },
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(({ address }) => ({ address }))
);

exports.nestedProperties = testQuery(
  collection,
  {
    query:
      'SELECT f.address.state, f.address.city FROM Families f WHERE f.id = "AndersenFamily"'
  },
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(({ address: { state, city } }) => ({ state, city }))
);

exports.JSONExpressions = testQuery(
  collection,
  {
    query: `
      SELECT { "state": f.address.state, "city": f.address.city, "name": f.id }
      FROM Families f
      WHERE f.id = "AndersenFamily"
    `
  },
  collection.filter(f => f.id === "AndersenFamily").map(f => ({
    $1: { state: f.address.state, city: f.address.city, name: f.id }
  }))
);

exports.implicitArgumentVariables = testQuery(
  collection,
  {
    query: `
      SELECT { "state": f.address.state, "city": f.address.city },
             { "name": f.id }
      FROM Families f
      WHERE f.id = "AndersenFamily"
    `
  },
  collection.filter(f => f.id === "AndersenFamily").map(f => ({
    $1: { state: f.address.state, city: f.address.city },
    $2: { name: f.id }
  }))
);

exports.subdocuments = testQuery(
  collection,
  { query: "SELECT * FROM Families.children" },
  collection.map(Families => Families.children)
);

exports.subdocumentsExcluded = testQuery(
  collection,
  { query: "SELECT * FROM Families.address.state" },
  collection.map(Families => Families.address.state).filter(v => v != null)
);

exports.binaryOperator1 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families.children[0] c
      WHERE c.grade % 2 = 1     -- matching grades == 5, 1
    `
  },
  collection
    .map(Families => Families.children[0])
    .filter(c => c.grade % 2 === 1)
);

exports.binaryOperator2 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families.children[0] c
      WHERE c.grade ^ 4 = 1    -- matching grades == 5
    `
  },
  collection
    .map(Families => Families.children[0])
    // eslint-disable-next-line no-bitwise
    .filter(c => (c.grade ^ 4) === 1)
);

exports.binaryOperator3 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families.children[0] c
      WHERE c.grade >= 5     -- matching grades == 5
    `
  },
  collection.map(Families => Families.children[0]).filter(c => c.grade >= 5)
);

exports.unaryOperator1 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families.children[0] c
      WHERE NOT(c.grade = 5)  -- matching grades == 1
    `
  },
  collection.map(Families => Families.children[0]).filter(c => !(c.grade === 5))
);

exports.unaryOperator2 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families.children[0] c
      WHERE (-c.grade = -5)  -- matching grades == 5
    `
  },
  collection.map(Families => Families.children[0]).filter(c => -c.grade === -5)
);

exports.betweenKeyword1 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families.children[0] c
      WHERE c.grade BETWEEN 1 AND 5
    `
  },
  collection
    .map(Families => Families.children[0])
    .filter(c => c.grade >= 1 && c.grade <= 5)
);

exports.betweenKeyword2 = testQuery(
  collection,
  {
    query: `
      SELECT (c.grade BETWEEN 0 AND 10)
      FROM Families.children[0] c
    `
  },
  collection
    .map(Families => Families.children[0])
    .map(c => ({ $1: c.grade >= 0 && c.grade <= 10 }))
);

exports.ternaryOperator1 = testQuery(
  collection,
  {
    query: `
      SELECT (c.grade < 5)? "elementary": "other" AS gradeLevel
      FROM Families.children[0] c
    `
  },
  collection
    .map(Families => Families.children[0])
    .map(c => ({ gradeLevel: c.grade < 5 ? "elementary" : "other" }))
);

exports.ternaryOperator2 = testQuery(
  collection,
  {
    query: `
      SELECT (c.grade < 5)? "elementary": ((c.grade < 9)? "junior": "high")  AS gradeLevel
      FROM Families.children[0] c
    `
  },
  collection.map(Families => Families.children[0]).map(c => ({
    // eslint-disable-next-line no-nested-ternary
    gradeLevel: c.grade < 5 ? "elementary" : c.grade < 9 ? "junior" : "high"
  }))
);

exports.coalesceOperator = testQuery(
  collection,
  {
    query: `
      SELECT f.lastName ?? f.surname AS familyName
      FROM Families f
    `
  },
  collection.map((f: Object) => ({ familyName: f.lastName || f.surname }))
);

exports.quotedPropertyAccessor = testQuery(
  collection,
  {
    query: `
      SELECT f["lastName"]
      FROM Families f
      WHERE f["id"] = "AndersenFamily"
    `
  },
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(({ lastName }: { lastName?: string }) => ({ lastName }))
);

exports.aliasing = testQuery(
  collection,
  {
    query: `
      SELECT
             { "state": f.address.state, "city": f.address.city } AS AddressInfo,
             { "name": f.id } NameInfo
      FROM Families f
      WHERE f.id = "AndersenFamily"
    `
  },
  collection.filter(f => f.id === "AndersenFamily").map(f => ({
    AddressInfo: { state: f.address.state, city: f.address.city },
    NameInfo: { name: f.id }
  }))
);

exports.scalarExpressions1 = testQuery(
  null,
  { query: 'SELECT "Hello World"' },
  [{ $1: "Hello World" }]
);

exports.scalarExpressions2 = testQuery(
  null,
  { query: "SELECT ((2 + 11 % 7)-2)/3" },
  [{ $1: (2 + (11 % 7) - 2) / 3 }]
);

exports.scalarExpressions3 = testQuery(
  collection,
  {
    query: `
      SELECT f.address.city = f.address.state AS AreFromSameCityState
      FROM Families f
    `
  },
  collection.map(f => ({
    AreFromSameCityState: f.address.city === f.address.state
  }))
);

exports.objectAndArrayCreation = testQuery(
  collection,
  {
    query: `
      SELECT [f.address.city, f.address.state] AS CityState
      FROM Families f
    `
  },
  collection.map(f => ({ CityState: [f.address.city, f.address.state] }))
);

exports.valueKeyword1 = testQuery(
  null,
  {
    query: 'SELECT VALUE "Hello World"'
  },
  ["Hello World"]
);

exports.valueKeyword2 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE f.address
      FROM Families f
    `
  },
  collection.map(f => f.address)
);

exports.valueKeyword3 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE f.address.state
      FROM Families f
    `
  },
  collection.map(f => f.address.state)
);

exports.asteriskOperator = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families f
      WHERE f.id = "AndersenFamily"
    `
  },
  collection.filter(f => f.id === "AndersenFamily")
);

exports.topOperator = testQuery(
  collection,
  {
    query: `
      SELECT TOP 1 *
      FROM Families f
    `
  },
  collection.slice(0, 1)
);

exports.aggregateFunctions1 = testQuery(
  collection,
  {
    query: `
      SELECT COUNT(1)
      FROM Families f
    `
  },
  [{ $1: 2 }]
);

exports.aggregateFunctions2 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE COUNT(1)
      FROM Families f
    `
  },
  [2]
);

exports.aggregateFunctions3 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE COUNT(1)
      FROM Families f
      WHERE f.address.state = "WA"
    `
  },
  [1]
);

exports.orderByClause1 = testQuery(
  collection,
  {
    query: `
      SELECT f.id, f.address.city
      FROM Families f
      ORDER BY f.address.city
    `
  },
  [
    {
      id: "WakefieldFamily",
      city: "NY"
    },
    {
      id: "AndersenFamily",
      city: "seattle"
    }
  ]
);

exports.orderByClause2 = testQuery(
  collection,
  {
    query: `
      SELECT f.id, f.creationDate
      FROM Families f
      ORDER BY f.creationDate DESC
    `
  },
  [
    {
      id: "AndersenFamily",
      creationDate: 1431620472
    },
    {
      id: "WakefieldFamily",
      creationDate: 1431620462
    }
  ]
);

exports.fromIn = testQuery(
  collection,
  { query: "SELECT * FROM c IN Families.children" },
  collection.reduce((_, Families) => [..._, ...Families.children], [])
);

exports.fromInAndFilter = testQuery(
  collection,
  { query: "SELECT c.givenName FROM c IN Families.children WHERE c.grade = 8" },
  collection
    .reduce((_, Families) => [..._, ...Families.children], [])
    .filter(c => c.grade === 8)
    .map(({ givenName }: Object) => ({ givenName }))
);

exports.parameterized = testQuery(
  collection,
  {
    query:
      "SELECT * FROM Families f WHERE f.lastName = @lastName AND f.address.state = @addressState",
    parameters: [
      { name: "@lastName", value: "Wakefield" },
      { name: "@addressState", value: "NY" }
    ]
  },
  collection.filter(f => f.lastName === "Wakefield" && f.address.state === "NY")
);

exports.builtInMathematicalFunction = testQuery(
  null,
  { query: "SELECT VALUE ABS(-4)" },
  [4]
);

exports.builtInTypeCheckingFunction = testQuery(
  null,
  { query: "SELECT VALUE IS_NUMBER(-4)" },
  [true]
);

exports.builtInStringFunction1 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE UPPER(Families.id)
      FROM Families
    `
  },
  collection.map(Families => Families.id.toUpperCase())
);

exports.builtInStringFunction2 = testQuery(
  collection,
  {
    query: `
      SELECT Families.id, CONCAT(Families.address.city, ",", Families.address.state) AS location
      FROM Families
    `
  },
  collection.map(Families => ({
    id: Families.id,
    location: `${Families.address.city},${Families.address.state}`
  }))
);

exports.builtInStringFunction3 = testQuery(
  collection,
  {
    query: `
      SELECT Families.id, Families.address.city
      FROM Families
      WHERE STARTSWITH(Families.id, "Wakefield")
    `
  },
  collection
    .filter(Families => Families.id.startsWith("Wakefield"))
    .map(Families => ({ id: Families.id, city: Families.address.city }))
);

exports.builtInArrayFunction1 = testQuery(
  collection,
  {
    query: `
      SELECT Families.id
      FROM Families
      WHERE ARRAY_CONTAINS(Families.parents, { givenName: "Robin", familyName: "Wakefield" })
    `
  },
  collection
    .filter(Families =>
      Families.parents.some(
        (v: Object) => v.givenName === "Robin" && v.familyName === "Wakefield"
      )
    )
    .map(Families => ({ id: Families.id }))
);

exports.builtInArrayFunction2 = testQuery(
  collection,
  {
    query: `
      SELECT Families.id, ARRAY_LENGTH(Families.children) AS numberOfChildren
      FROM Families
    `
  },
  collection.map(Families => ({
    id: Families.id,
    numberOfChildren: Families.children.length
  }))
);
