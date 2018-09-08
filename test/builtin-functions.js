// @flow
// test examples on https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-sql-query-reference#bk_built_in_functions

const testQuery = require("./utils/test-query");

const test = (query, expected) => testQuery(null, { query }, expected);

exports.CEILING = test(
  `
    SELECT CEILING(123.45), CEILING(-123.45), CEILING(0.0)
  `,
  [{ $1: 124, $2: -123, $3: 0 }]
);

exports.FLOOR = test(
  `
    SELECT FLOOR(123.45), FLOOR(-123.45), FLOOR(0.0)
  `,
  [{ $1: 123, $2: -124, $3: 0 }]
);

exports.ROUND = test(
  `
    SELECT ROUND(2.4), ROUND(2.6), ROUND(2.5), ROUND(-2.4), ROUND(-2.6)
  `,
  [{ $1: 2, $2: 3, $3: 3, $4: -2, $5: -3 }]
);

exports.IS_ARRAY = test(
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

exports.IS_BOOL = test(
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

exports.IS_DEFINED = test(
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

exports.IS_NULL = test(
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

exports.IS_NUMBER = test(
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

exports.IS_OBJECT = test(
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

exports.IS_PRIMITIVE = test(
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

exports.IS_STRING = test(
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

exports.CONCAT = test(
  `
    SELECT CONCAT("abc", "def")
  `,
  [{ $1: "abcdef" }]
);

exports.CONTAINS = test(
  `
    SELECT CONTAINS("abc", "ab"), CONTAINS("abc", "d")
  `,
  [{ $1: true, $2: false }]
);

exports.INDEX_OF = test(
  `
    SELECT INDEX_OF("abc", "ab"), INDEX_OF("abc", "b"), INDEX_OF("abc", "d")
  `,
  [{ $1: 0, $2: 1, $3: -1 }]
);

exports.LENGTH = test(
  `
    SELECT LENGTH("abc")
  `,
  [{ $1: 3 }]
);

exports.LOWER = test(
  `
    SELECT LOWER("Abc")
  `,
  [{ $1: "abc" }]
);

exports.REVERSE = test(
  `
    SELECT REVERSE("Abc")
  `,
  [{ $1: "cbA" }]
);

exports.STARTSWITH = test(
  `
    SELECT STARTSWITH("abc", "b"), STARTSWITH("abc", "a")
  `,
  [{ $1: false, $2: true }]
);

exports.SUBSTRING = test(
  `
    SELECT SUBSTRING("abc", 1, 1)
  `,
  [{ $1: "b" }]
);

exports.ToString1 = test(
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
      $7: "false",
      $8: undefined
    }
  ]
);

exports.ToString2 = testQuery(
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

exports.TRIM = test(
  `
    SELECT TRIM("   abc"), TRIM("   abc   "), TRIM("abc   "), TRIM("abc")
  `,
  [{ $1: "abc", $2: "abc", $3: "abc", $4: "abc" }]
);

exports.UPPER = test(
  `
    SELECT UPPER("Abc")
  `,
  [{ $1: "ABC" }]
);

exports.ARRAY_CONCAT = test(
  `
    SELECT ARRAY_CONCAT(["apples", "strawberries"], ["bananas"])
  `,
  [{ $1: ["apples", "strawberries", "bananas"] }]
);

exports.ARRAY_CONTAINS = test(
  `
    SELECT
      ARRAY_CONTAINS(["apples", "strawberries", "bananas"], "apples"),
      ARRAY_CONTAINS(["apples", "strawberries", "bananas"], "mangoes")
  `,
  [{ $1: true, $2: false }]
);

exports.ARRAY_LENGTH = test(
  `
    SELECT ARRAY_LENGTH(["apples", "strawberries", "bananas"])
  `,
  [{ $1: 3 }]
);

exports.ARRAY_SLICE = test(
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
