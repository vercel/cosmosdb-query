// @flow
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

exports.conditionalExpression1 = testQuery(
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

exports.conditionalExpression2 = testQuery(
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
  collection,
  { query: 'SELECT "Hello World"' },
  [{ $1: "Hello World" }]
);

exports.scalarExpressions2 = testQuery(
  collection,
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
