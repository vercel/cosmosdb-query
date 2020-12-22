// test examples on https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-sql-query-reference#bk_built_in_functions

import testQuery from "./utils/test-query";

const test = (query: string, expected: any) =>
  testQuery(null, { query }, expected);

export const ABS = test("SELECT ABS(-1), ABS(0), ABS(1)", [
  { $1: 1, $2: 0, $3: 1 }
]);

export const ACOS = test("SELECT ACOS(-1)", [{ $1: 3.1415926535897931 }]);

export const ASIN = test("SELECT ASIN(-1)", [{ $1: -1.5707963267948966 }]);

export const ATAN = test("SELECT ATAN(-45.01)", [{ $1: -1.5485826962062663 }]);

export const ATN2 = test("SELECT ATN2(35.175643, 129.44)", [
  { $1: 1.3054517947300646 }
]);

export const CEILING = test(
  `
    SELECT CEILING(123.45), CEILING(-123.45), CEILING(0.0)
  `,
  [{ $1: 124, $2: -123, $3: 0 }]
);

export const COS = test("SELECT COS(14.78)", [{ $1: -0.59946542619465426 }]);

export const COT = test("SELECT COT(124.1332)", [
  { $1: -0.040311998371148884 }
]);

export const DEGREES = test("SELECT DEGREES(PI()/2)", [{ $1: 90 }]);

export const EXP1 = test("SELECT EXP(10)", [{ $1: 22026.465794806718 }]);

export const EXP2 = test("SELECT EXP(LOG(20)), LOG(EXP(20))", [
  { $1: 19.999999999999996, $2: 20 }
]);

export const FLOOR = test(
  `
    SELECT FLOOR(123.45), FLOOR(-123.45), FLOOR(0.0)
  `,
  [{ $1: 123, $2: -124, $3: 0 }]
);

export const LOG_1 = test("SELECT LOG(10)", [{ $1: 2.3025850929940459 }]);

export const LOG_2 = test("SELECT EXP(LOG(10))", [{ $1: 10.000000000000002 }]);

export const LOG10 = test("SELECT LOG10(100)", [{ $1: 2 }]);

export const PI = test("SELECT PI()", [{ $1: 3.1415926535897931 }]);

export const POWER = test("SELECT POWER(2, 3), POWER(2.5, 3)", [
  { $1: 8, $2: 15.625 }
]);

export const RADIANS = test(
  "SELECT RADIANS(-45.01), RADIANS(-181.01), RADIANS(0), RADIANS(0.1472738), RADIANS(197.1099392)",
  [
    {
      $1: -0.7855726963226477,
      $2: -3.1592204790349356,
      $3: 0,
      $4: 0.0025704127119236249,
      $5: 3.4402174274458375
    }
  ]
);

export const ROUND = test(
  `
    SELECT ROUND(2.4), ROUND(2.6), ROUND(2.5), ROUND(-2.4), ROUND(-2.6)
  `,
  [{ $1: 2, $2: 3, $3: 3, $4: -2, $5: -3 }]
);

export const SIGN = test(
  "SELECT SIGN(-2), SIGN(-1), SIGN(0), SIGN(1), SIGN(2)",
  [{ $1: -1, $2: -1, $3: 0, $4: 1, $5: 1 }]
);

export const SIN = test("SELECT SIN(45.175643)", [{ $1: 0.929607286611012 }]);

export const SQRT = test("SELECT SQRT(1), SQRT(2.0), SQRT(3)", [
  { $1: 1, $2: 1.4142135623730952, $3: 1.7320508075688772 }
]);

export const SQUARE = test("SELECT SQUARE(1), SQUARE(2.0), SQUARE(3)", [
  { $1: 1, $2: 4, $3: 9 }
]);

export const TAN = test("SELECT TAN(PI()/2)", [{ $1: 16331239353195370 }]);

export const TRUNC = test(
  "SELECT TRUNC(2.4), TRUNC(2.6), TRUNC(2.5), TRUNC(-2.4), TRUNC(-2.6)",
  [{ $1: 2, $2: 2, $3: 2, $4: -2, $5: -2 }]
);

export const IS_ARRAY = test(
  `
  SELECT
    IS_ARRAY(true),
    IS_ARRAY(1),
    IS_ARRAY("value"),
    IS_ARRAY(null),
    IS_ARRAY({prop: "value"}),
    IS_ARRAY([1, 2, 3]),
    IS_ARRAY({prop: "value"}.prop2)
  `,
  [
    {
      $1: false,
      $2: false,
      $3: false,
      $4: false,
      $5: false,
      $6: true,
      $7: false
    }
  ]
);

export const IS_BOOL = test(
  `
    SELECT
      IS_BOOL(true),
      IS_BOOL(1),
      IS_BOOL("value"),
      IS_BOOL(null),
      IS_BOOL({prop: "value"}),
      IS_BOOL([1, 2, 3]),
      IS_BOOL({prop: "value"}.prop2)
  `,
  [
    {
      $1: true,
      $2: false,
      $3: false,
      $4: false,
      $5: false,
      $6: false,
      $7: false
    }
  ]
);

export const IS_DEFINED = test(
  `
    SELECT IS_DEFINED({ "a" : 5 }.a), IS_DEFINED({ "a" : 5 }.b)
  `,
  [
    {
      $1: true,
      $2: false
    }
  ]
);

export const IS_NULL = test(
  `
    SELECT
      IS_NULL(true),
      IS_NULL(1),
      IS_NULL("value"),
      IS_NULL(null),
      IS_NULL({prop: "value"}),
      IS_NULL([1, 2, 3]),
      IS_NULL({prop: "value"}.prop2)
  `,
  [
    {
      $1: false,
      $2: false,
      $3: false,
      $4: true,
      $5: false,
      $6: false,
      $7: false
    }
  ]
);

export const IS_NUMBER = test(
  `
    SELECT
      IS_NUMBER(true),
      IS_NUMBER(1),
      IS_NUMBER("value"),
      IS_NUMBER(null),
      IS_NUMBER({prop: "value"}),
      IS_NUMBER([1, 2, 3]),
      IS_NUMBER({prop: "value"}.prop2)
  `,
  [
    {
      $1: false,
      $2: true,
      $3: false,
      $4: false,
      $5: false,
      $6: false,
      $7: false
    }
  ]
);

export const IS_OBJECT = test(
  `
    SELECT
      IS_OBJECT(true),
      IS_OBJECT(1),
      IS_OBJECT("value"),
      IS_OBJECT(null),
      IS_OBJECT({prop: "value"}),
      IS_OBJECT([1, 2, 3]),
      IS_OBJECT({prop: "value"}.prop2)
  `,
  [
    {
      $1: false,
      $2: false,
      $3: false,
      $4: false,
      $5: true,
      $6: false,
      $7: false
    }
  ]
);

export const IS_PRIMITIVE = test(
  `
    SELECT
      IS_PRIMITIVE(true),
      IS_PRIMITIVE(1),
      IS_PRIMITIVE("value"),
      IS_PRIMITIVE(null),
      IS_PRIMITIVE({prop: "value"}),
      IS_PRIMITIVE([1, 2, 3]),
      IS_PRIMITIVE({prop: "value"}.prop2)
  `,
  [{ $1: true, $2: true, $3: true, $4: true, $5: false, $6: false, $7: false }]
);

export const IS_STRING = test(
  `
    SELECT
      IS_STRING(true),
      IS_STRING(1),
      IS_STRING("value"),
      IS_STRING(null),
      IS_STRING({prop: "value"}),
      IS_STRING([1, 2, 3]),
      IS_STRING({prop: "value"}.prop2)
  `,
  [
    {
      $1: false,
      $2: false,
      $3: true,
      $4: false,
      $5: false,
      $6: false,
      $7: false
    }
  ]
);

export const CONCAT = test(
  `
    SELECT CONCAT("abc", "def")
  `,
  [{ $1: "abcdef" }]
);

export const CONTAINS = test(
  `
    SELECT CONTAINS("abc", "ab"), CONTAINS("abc", "d")
  `,
  [{ $1: true, $2: false }]
);

export const ENDSWITH = test(
  'SELECT ENDSWITH("abc", "b"), ENDSWITH("abc", "bc")',
  [{ $1: false, $2: true }]
);

export const INDEX_OF = test(
  `
    SELECT INDEX_OF("abc", "ab"), INDEX_OF("abc", "b"), INDEX_OF("abc", "d")
  `,
  [{ $1: 0, $2: 1, $3: -1 }]
);

export const LEFT = test('SELECT LEFT("abc", 1), LEFT("abc", 2)', [
  { $1: "a", $2: "ab" }
]);

export const LENGTH = test(
  `
    SELECT LENGTH("abc")
  `,
  [{ $1: 3 }]
);

export const LOWER = test(
  `
    SELECT LOWER("Abc")
  `,
  [{ $1: "abc" }]
);

export const LTRIM = test(
  'SELECT LTRIM("  abc"), LTRIM("abc"), LTRIM("abc   ")',
  [{ $1: "abc", $2: "abc", $3: "abc   " }]
);

export const REPLACE = test(
  'SELECT REPLACE("This is a Test", "Test", "desk")',
  [{ $1: "This is a desk" }]
);

export const REPLICATE = test('SELECT REPLICATE("a", 3)', [{ $1: "aaa" }]);

export const REVERSE = test(
  `
    SELECT REVERSE("Abc")
  `,
  [{ $1: "cbA" }]
);

export const RIGHT = test('SELECT RIGHT("abc", 1), RIGHT("abc", 2)', [
  { $1: "c", $2: "bc" }
]);

export const RTRIM = test(
  'SELECT RTRIM("  abc"), RTRIM("abc"), RTRIM("abc   ")',
  [{ $1: "  abc", $2: "abc", $3: "abc" }]
);

export const STARTSWITH = test(
  `
    SELECT STARTSWITH("abc", "b"), STARTSWITH("abc", "a")
  `,
  [{ $1: false, $2: true }]
);

export const SUBSTRING = test(
  `
    SELECT SUBSTRING("abc", 1, 1)
  `,
  [{ $1: "b" }]
);

export const ToString1 = test(
  `
    SELECT ToString(1.0000), ToString("Hello World"), ToString(NaN), ToString(Infinity),
    ToString(IS_STRING(ToString(undefined))), IS_STRING(ToString(0.1234)), ToString(false), ToString(undefined)
  `,
  [
    {
      $1: "1",
      $2: "Hello World",
      $3: "NaN",
      $4: "Infinity",
      $5: "false",
      $6: true,
      $7: "false"
    }
  ]
);

export const ToString2 = testQuery(
  [
    {
      Products: [
        { ProductID: 1, Weight: 4, WeightUnits: "lb" },
        { ProductID: 2, Weight: 32, WeightUnits: "kg" },
        { ProductID: 3, Weight: 400, WeightUnits: "g" },
        { ProductID: 4, Weight: 8999, WeightUnits: "mg" }
      ]
    }
  ],
  {
    query: `
      SELECT
      CONCAT(ToString(p.Weight), p.WeightUnits)
      FROM p in c.Products
    `
  },
  [{ $1: "4lb" }, { $1: "32kg" }, { $1: "400g" }, { $1: "8999mg" }]
);

export const ToString3 = testQuery(
  [
    {
      id: "08259",
      description: "Cereals ready-to-eat, KELLOGG, KELLOGG'S CRISPIX",
      nutrients: [
        { id: "305", description: "Caffeine", units: "mg" },
        {
          id: "306",
          description: "Cholesterol, HDL",
          nutritionValue: 30,
          units: "mg"
        },
        {
          id: "307",
          description: "Sodium, NA",
          nutritionValue: 612,
          units: "mg"
        },
        {
          id: "308",
          description: "Protein, ABP",
          nutritionValue: 60,
          units: "mg"
        },
        {
          id: "309",
          description: "Zinc, ZN",
          nutritionValue: null,
          units: "mg"
        }
      ]
    }
  ],
  {
    query: `
      SELECT
        n.id AS nutrientID,
        REPLACE(ToString(n.nutritionValue), "6", "9") AS nutritionVal
      FROM food
      JOIN n IN food.nutrients
    `
  },
  [
    { nutrientID: "305" },
    { nutrientID: "306", nutritionVal: "30" },
    { nutrientID: "307", nutritionVal: "912" },
    { nutrientID: "308", nutritionVal: "90" },
    { nutrientID: "309", nutritionVal: "null" }
  ]
);

export const TRIM = test(
  `
    SELECT TRIM("   abc"), TRIM("   abc   "), TRIM("abc   "), TRIM("abc")
  `,
  [{ $1: "abc", $2: "abc", $3: "abc", $4: "abc" }]
);

export const UPPER = test(
  `
    SELECT UPPER("Abc")
  `,
  [{ $1: "ABC" }]
);

export const ARRAY_CONCAT = test(
  `
    SELECT ARRAY_CONCAT(["apples", "strawberries"], ["bananas"])
  `,
  [{ $1: ["apples", "strawberries", "bananas"] }]
);

export const ARRAY_CONTAINS1 = test(
  `
    SELECT
      ARRAY_CONTAINS(["apples", "strawberries", "bananas"], "apples"),
      ARRAY_CONTAINS(["apples", "strawberries", "bananas"], "mangoes")
  `,
  [{ $1: true, $2: false }]
);

export const ARRAY_CONTAINS2 = test(
  `
    SELECT
      ARRAY_CONTAINS([{"name": "apples", "fresh": true}, {"name": "strawberries", "fresh": true}], {"name": "apples"}, true),
      ARRAY_CONTAINS([{"name": "apples", "fresh": true}, {"name": "strawberries", "fresh": true}], {"name": "apples"}),
      ARRAY_CONTAINS([{"name": "apples", "fresh": true}, {"name": "strawberries", "fresh": true}], {"name": "mangoes"}, true)
  `,
  [
    {
      $1: true,
      $2: false,
      $3: false
    }
  ]
);

export const ARRAY_LENGTH = test(
  `
    SELECT ARRAY_LENGTH(["apples", "strawberries", "bananas"])
  `,
  [{ $1: 3 }]
);

export const ARRAY_SLICE = test(
  `
    SELECT
      ARRAY_SLICE(["apples", "strawberries", "bananas"], 1),
      ARRAY_SLICE(["apples", "strawberries", "bananas"], 1, 1)
  `,
  [
    {
      $1: ["strawberries", "bananas"],
      $2: ["strawberries"]
    }
  ]
);

// Spatial functions

const geometries = {
  points: {
    a: {
      'type': 'Point',
      'coordinates': [0.5, 0.5]
    },
    b: {
      'type': 'Point',
      'coordinates': [1, 0]
    },
    c: {
      'type': 'Point',
      'coordinates': [1.5, -0.5]
    },
    d: {
      'type': 'Point',
      'coordinates': [0, 0]
    }
  },
  polygons: {
    a: {
      'type': 'Polygon',
      'coordinates': [
        [
          [0, 0], [0, 1], [1, 1], [1, 0], [0, 0]
        ]
      ]
    },
    b: {
      'type': 'Polygon',
      'coordinates': [
        [
          [0.5, -0.5], [0.5, 0.5], [1.5, 0.5], [1.5, -0.5], [0.5, -0.5]
        ]
      ]
    },
    c: {
      'type': 'Polygon',
      'coordinates': [
        [
          [1, -1], [1, 0], [2, 0], [2, -1], [1, -1]
        ]
      ]
    },
    d: {
      'type': 'Polygon',
      'coordinates': [
        [
          [1.5, -1.5], [1.5, -0.5], [2.5, -0.5], [2.5, -1.5], [1.5, -1.5]
        ]
      ]
    },
    e: {
      'type': 'Polygon',
      'coordinates': [
        [
          [0.25, 0.25], [0.25, 0.75], [0.75, 0.75], [0.75, 0.25], [0.25, 0.25]
        ]
      ]
    },
    f: {
      'type': 'Polygon',
      'coordinates': [
        [
          [0.25, 0], [0.25, 0.5], [0.75, 0.5], [0.75, 0], [0.25, 0]
        ]
      ]
    },
  }
}

export const ST_DISTANCE = testQuery(
  null,
  {
    query: `
      SELECT
        ROUND(ST_DISTANCE(@pa, @pb)),
        ST_DISTANCE(@pa, @pa)
    `,
    parameters: [
      {
        name: "@pa",
        value: geometries.points.a
      }, {
        name: "@pb",
        value: geometries.points.b
      }, {
        name: "@a",
        value: geometries.polygons.a
      }, {
        name: "@d",
        value: geometries.polygons.d
      }
    ]
  },
  [
    {
      $1: 78626,
      $2: 0.0
    }
  ]
)

export const ST_DISTANCE_query = testQuery(
  [
    { id: "a", geometry: geometries.points.a },
    { id: "b", geometry: geometries.points.b },
    { id: "c", geometry: geometries.points.c },
    { id: "d", geometry: geometries.points.d }
  ],
  {
    query: `
      SELECT items.id
      FROM items
      WHERE ST_DISTANCE(items.geometry, @geom) <= 80000
    `,
    parameters: [
      {
        name: "@geom",
        value: geometries.polygons.b
      }
    ]
  },
  [
    { "id": 'a' },
    { "id": 'b' },
    { "id": 'c' },
  ]
)

export const ST_WITHIN = testQuery(
  null,
  {
    query: `
      SELECT
        ST_WITHIN(@pa, @a),
        ST_WITHIN(@pa, @b),
        ST_WITHIN(@pd, @a)
    `,
    parameters: [
      {
        name: "@a",
        value: geometries.polygons.a
      }, {
        name: "@b",
        value: geometries.polygons.b
      }, {
        name: "@pa",
        value: geometries.points.a
      }, {
        name: "@pd",
        value: geometries.points.d
      }
    ]
  },
  [
    {
      $1: true,
      $2: false,
      $3: false
    }
  ]
)

export const ST_WITHIN_query = testQuery(
  [
    { id: "a", geometry: geometries.points.a },
    { id: "b", geometry: geometries.points.b },
    { id: "c", geometry: geometries.points.c },
    { id: "d", geometry: geometries.points.d }
  ],
  {
    query: `
      SELECT items.id
      FROM items
      WHERE ST_WITHIN(items.geometry, @geom)
    `,
    parameters: [
      {
        name: "@geom",
        value: geometries.polygons.a
      }
    ]
  },
  [
    { "id": 'a' },
  ]
)

export const ST_INTERSECTS = testQuery(
  null,
  {
    query: `
      SELECT
        ST_INTERSECTS(@a, @b),
        ST_INTERSECTS(@a, @c),
        ST_INTERSECTS(@a, @d)
    `,
    parameters: [
      {
        name: "@a",
        value: JSON.stringify(geometries.polygons.a)
      }, {
        name: "@b",
        value: JSON.stringify(geometries.polygons.b)
      }, {
        name: "@c",
        value: JSON.stringify(geometries.polygons.c)
      }, {
        name: "@d",
        value: JSON.stringify(geometries.polygons.d)
      }
    ]
  },
  [
    {
      $1: true,
      $2: true,
      $3: false
    }
  ]
)

export const ST_INTERSECTS_query = testQuery(
  [
    { id: "a", geometry: geometries.points.a },
    { id: "b", geometry: geometries.points.b },
    { id: "c", geometry: geometries.points.c },
    { id: "d", geometry: geometries.points.d }
  ],
  {
    query: `
      SELECT items.id
      FROM items
      WHERE ST_INTERSECTS(items.geometry, @geom)
    `,
    parameters: [
      {
        name: "@geom",
        value: geometries.polygons.a
      }
    ]
  },
  [
    { "id": 'a' },
    { "id": 'b' },
    { "id": 'd' },
  ]
)