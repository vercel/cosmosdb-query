// test examples on https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-sql-query

import testQuery from "./utils/test-query";

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

export const all = testQuery(
  collection,
  { query: "SELECT * FROM c" },
  collection
);

export const query1 = testQuery(
  collection,
  { query: 'SELECT * FROM Families f WHERE f.id = "AndersenFamily"' },
  collection.filter(({ id }) => id === "AndersenFamily")
);

export const query2 = testQuery(
  collection,
  {
    query: `
      SELECT {"Name":f.id, "City":f.address.city} AS Family
      FROM Families f
      WHERE f.address.city = f.address.state
    `
  },
  [
    {
      Family: {
        Name: "WakefieldFamily",
        City: "NY"
      }
    }
  ]
);

export const query3 = testQuery(
  collection,
  {
    query: `
      SELECT c.givenName
      FROM Families f
      JOIN c IN f.children
      WHERE f.id = 'WakefieldFamily'
      ORDER BY f.address.city ASC
    `
  },
  [{ givenName: "Jesse" }, { givenName: "Lisa" }]
);

export const select = testQuery(
  collection,
  { query: 'SELECT f.address FROM Families f WHERE f.id = "AndersenFamily"' },
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(({ address }) => ({ address }))
);

export const nestedProperties = testQuery(
  collection,
  {
    query:
      'SELECT f.address.state, f.address.city FROM Families f WHERE f.id = "AndersenFamily"'
  },
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(({ address: { state, city } }) => ({ state, city }))
);

export const JSONExpressions = testQuery(
  collection,
  {
    query: `
      SELECT { "state": f.address.state, "city": f.address.city, "name": f.id }
      FROM Families f
      WHERE f.id = "AndersenFamily"
    `
  },
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(f => ({
      $1: { state: f.address.state, city: f.address.city, name: f.id }
    }))
);

export const implicitArgumentVariables = testQuery(
  collection,
  {
    query: `
      SELECT { "state": f.address.state, "city": f.address.city },
             { "name": f.id }
      FROM Families f
      WHERE f.id = "AndersenFamily"
    `
  },
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(f => ({
      $1: { state: f.address.state, city: f.address.city },
      $2: { name: f.id }
    }))
);

export const subdocuments = testQuery(
  collection,
  { query: "SELECT * FROM Families.children" },
  collection.map(Families => Families.children)
);

export const subdocumentsExcluded = testQuery(
  collection,
  { query: "SELECT * FROM Families.address.state" },
  collection.map(Families => Families.address.state).filter(v => v != null)
);

export const binaryOperator1 = testQuery(
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

export const binaryOperator2 = testQuery(
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

export const binaryOperator3 = testQuery(
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

export const unaryOperator1 = testQuery(
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

export const unaryOperator2 = testQuery(
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

export const betweenKeyword1 = testQuery(
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

export const betweenKeyword2 = testQuery(
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

export const inKeyword1 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families
      WHERE Families.id IN ('AndersenFamily', 'WakefieldFamily')
    `
  },
  collection.filter(Families =>
    ["AndersenFamily", "WakefieldFamily"].includes(Families.id)
  )
);

export const inKeyword2 = testQuery(
  collection,
  {
    query: `
      SELECT *
      FROM Families
      WHERE Families.address.state IN ("NY", "WA", "CA", "PA", "OH", "OR", "MI", "WI", "MN", "FL")
    `
  },
  collection.filter(Families =>
    ["NY", "WA", "CA", "PA", "OH", "OR", "MI", "WI", "MN", "FL"].includes(
      Families.address.state
    )
  )
);

export const ternaryOperator1 = testQuery(
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

export const ternaryOperator2 = testQuery(
  collection,
  {
    query: `
      SELECT (c.grade < 5)? "elementary": ((c.grade < 9)? "junior": "high")  AS gradeLevel
      FROM Families.children[0] c
    `
  },
  collection
    .map(Families => Families.children[0])
    .map(c => ({
      // eslint-disable-next-line no-nested-ternary
      gradeLevel: c.grade < 5 ? "elementary" : c.grade < 9 ? "junior" : "high"
    }))
);

export const coalesceOperator = testQuery(
  collection,
  {
    query: `
      SELECT f.lastName ?? f.surname AS familyName
      FROM Families f
    `
  },
  [{ familyName: "Andersen" }, {}]
);

export const quotedPropertyAccessor = testQuery(
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

export const aliasing = testQuery(
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
  collection
    .filter(f => f.id === "AndersenFamily")
    .map(f => ({
      AddressInfo: { state: f.address.state, city: f.address.city },
      NameInfo: { name: f.id }
    }))
);

export const scalarExpressions1 = testQuery(
  null,
  { query: 'SELECT "Hello World"' },
  [{ $1: "Hello World" }]
);

export const scalarExpressions2 = testQuery(
  null,
  { query: "SELECT ((2 + 11 % 7)-2)/3" },
  [{ $1: (2 + (11 % 7) - 2) / 3 }]
);

export const scalarExpressions3 = testQuery(
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

export const objectAndArrayCreation = testQuery(
  collection,
  {
    query: `
      SELECT [f.address.city, f.address.state] AS CityState
      FROM Families f
    `
  },
  collection.map(f => ({ CityState: [f.address.city, f.address.state] }))
);

export const valueKeyword1 = testQuery(
  null,
  {
    query: 'SELECT VALUE "Hello World"'
  },
  ["Hello World"]
);

export const valueKeyword2 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE f.address
      FROM Families f
    `
  },
  collection.map(f => f.address)
);

export const valueKeyword3 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE f.address.state
      FROM Families f
    `
  },
  collection.map(f => f.address.state)
);

export const asteriskOperator = testQuery(
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

export const topOperator = testQuery(
  collection,
  {
    query: `
      SELECT TOP 1 *
      FROM Families f
    `
  },
  collection.slice(0, 1)
);

export const aggregateFunctions1 = testQuery(
  collection,
  {
    query: `
      SELECT COUNT(1)
      FROM Families f
    `
  },
  [{ $1: 2 }]
);

export const aggregateFunctions2 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE COUNT(1)
      FROM Families f
    `
  },
  [2]
);

export const aggregateFunctions3 = testQuery(
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

export const orderByClause1 = testQuery(
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

export const orderByClause2 = testQuery(
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

export const orderByClause3 = testQuery(
  collection,
  {
    query: `
      SELECT f.id, f.creationDate
      FROM Families f
      ORDER BY f.address.city ASC, f.creationDate DESC
    `
  },
  [
    {
      id: "WakefieldFamily",
      creationDate: 1431620462
    },
    {
      id: "AndersenFamily",
      creationDate: 1431620472
    }
  ]
);

export const iteration1 = testQuery(
  collection,
  { query: "SELECT * FROM c IN Families.children" },
  collection.reduce((_, Families) => [..._, ...Families.children], [])
);

export const iteration2 = testQuery(
  collection,
  { query: "SELECT c.givenName FROM c IN Families.children WHERE c.grade = 8" },
  [
    {
      givenName: "Lisa"
    }
  ]
);

export const iteration3 = testQuery(
  collection,
  {
    query: `
      SELECT COUNT(child)
      FROM child IN Families.children
    `
  },
  [
    {
      $1: 3
    }
  ]
);

export const join1 = testQuery(
  collection,
  {
    query: `
      SELECT f.id
      FROM Families f
      JOIN f.NonExistent
    `
  },
  []
);

export const join2 = testQuery(
  collection,
  {
    query: `
      SELECT f.id
      FROM Families f
      JOIN f.children
    `
  },
  [
    {
      id: "AndersenFamily"
    },
    {
      id: "WakefieldFamily"
    }
  ]
);

export const join3 = testQuery(
  collection,
  {
    query: `
      SELECT f.id
      FROM Families f
      JOIN c IN f.children
    `
  },
  [
    {
      id: "AndersenFamily"
    },
    {
      id: "WakefieldFamily"
    },
    {
      id: "WakefieldFamily"
    }
  ]
);

export const join4 = testQuery(
  collection,
  {
    query: `
      SELECT
        f.id AS familyName,
        c.givenName AS childGivenName,
        c.firstName AS childFirstName,
        p.givenName AS petName
      FROM Families f
      JOIN c IN f.children
      JOIN p IN c.pets
    `
  },
  [
    {
      familyName: "AndersenFamily",
      childFirstName: "Henriette Thaulow",
      petName: "Fluffy"
    },
    {
      familyName: "WakefieldFamily",
      childGivenName: "Jesse",
      petName: "Goofy"
    },
    {
      familyName: "WakefieldFamily",
      childGivenName: "Jesse",
      petName: "Shadow"
    }
  ]
);

export const join5 = testQuery(
  collection,
  {
    query: `
      SELECT
          f.id AS familyName,
          c.givenName AS childGivenName,
          c.firstName AS childFirstName,
          p.givenName AS petName
      FROM Families f
      JOIN c IN f.children
      JOIN p IN c.pets
      WHERE p.givenName = "Shadow"
    `
  },
  [
    {
      familyName: "WakefieldFamily",
      childGivenName: "Jesse",
      petName: "Shadow"
    }
  ]
);

const REGEX_MATCH = function REGEX_MATCH(input: string, pattern: string) {
  return input.match(pattern) !== null;
};

export const udf1 = testQuery(
  collection,
  {
    query: `
      SELECT udf.REGEX_MATCH(Families.address.city, ".*eattle")
      FROM Families
    `,
    udf: { REGEX_MATCH }
  },
  [
    {
      $1: true
    },
    {
      $1: false
    }
  ]
);

export const udf2 = testQuery(
  collection,
  {
    query: `
      SELECT Families.id, Families.address.city
      FROM Families
      WHERE udf.REGEX_MATCH(Families.address.city, ".*eattle")
    `,
    udf: { REGEX_MATCH }
  },
  [
    {
      id: "AndersenFamily",
      city: "seattle"
    }
  ]
);

export const udf3 = testQuery(
  collection,
  {
    query: `
      SELECT f.address.city, udf.SEALEVEL(f.address.city) AS seaLevel
      FROM Families f
    `,
    udf: {
      SEALEVEL(city: string) {
        switch (city) {
          case "seattle":
            return 520;
          case "NY":
            return 410;
          case "Chicago":
            return 673;
          default:
            return -1;
        }
      }
    }
  },
  [
    {
      city: "seattle",
      seaLevel: 520
    },
    {
      city: "NY",
      seaLevel: 410
    }
  ]
);

export const parameterized = testQuery(
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

export const builtInMathematicalFunction = testQuery(
  null,
  { query: "SELECT VALUE ABS(-4)" },
  [4]
);

export const builtInTypeCheckingFunction = testQuery(
  null,
  { query: "SELECT VALUE IS_NUMBER(-4)" },
  [true]
);

export const builtInStringFunction1 = testQuery(
  collection,
  {
    query: `
      SELECT VALUE UPPER(Families.id)
      FROM Families
    `
  },
  collection.map(Families => Families.id.toUpperCase())
);

export const builtInStringFunction2 = testQuery(
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

export const builtInStringFunction3 = testQuery(
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

export const builtInArrayFunction1 = testQuery(
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
        (v: { [x: string]: any }) =>
          v.givenName === "Robin" && v.familyName === "Wakefield"
      )
    )
    .map(Families => ({ id: Families.id }))
);

export const builtInArrayFunction2 = testQuery(
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
