// test examples on https://docs.microsoft.com/en-us/azure/cosmos-db/sql-query-subquery

import * as assert from "assert";
import query from "../lib";

const collection = [
  {
    id: "00001",
    description: "infant formula",
    tags: [{ name: "infant formula" }],
    nutrients: [
      {
        id: "1",
        description: "A",
        nutritionValue: 1,
        units: "g"
      }
    ],
    servings: [{ amount: 1 }, { amount: 2 }]
  },
  {
    id: "00002",
    description: "fruit, infant formula",
    tags: [{ name: "fruit" }, { name: "infant formula" }],
    nutrients: [
      { id: "1", description: "A", nutritionValue: 1, units: "g" },
      { id: "2", description: "B", nutritionValue: 2 },
      { id: "3", description: "C", nutritionValue: 101, units: "mg" }
    ],
    servings: [{ amount: 3 }, { amount: 4 }]
  },
  {
    id: "00003",
    description: "snacks",
    tags: [{ name: "snacks" }],
    nutrients: [
      { id: "4", description: "C", nutritionValue: 70, units: "mg" },
      { id: "5", description: "D", nutritionValue: 102, units: "mg" }
    ],
    servings: [{ amount: 3 }]
  }
];

export const optimizeJoinExpression = () => {
  const data1 = query(`
    SELECT Count(1) AS Count
    FROM c
    JOIN t IN c.tags
    JOIN n IN c.nutrients
    JOIN s IN c.servings
    WHERE t.name = 'infant formula'
      AND (n.nutritionValue > 0
      AND n.nutritionValue < 10) AND s.amount > 1
  `).exec(collection);

  const data2 = query(`
    SELECT Count(1) AS Count
    FROM c
    JOIN (SELECT VALUE t FROM t IN c.tags WHERE t.name = 'infant formula')
    JOIN (SELECT VALUE n FROM n IN c.nutrients WHERE n.nutritionValue > 0 AND n.nutritionValue < 10)
    JOIN (SELECT VALUE s FROM s IN c.servings WHERE s.amount > 1)
  `).exec(collection);

  assert.deepStrictEqual(data1, data2);
  assert.deepStrictEqual(data1.result, [{ Count: 5 }]);
};

export const evaluateOnceAndReferenceManyTimes = () => {
  const udf = {
    GetMaxNutritionValue(nutrients: any) {
      if (!nutrients || !Array.isArray(nutrients) || !nutrients.length)
        return undefined;

      return nutrients.reduce(
        (max, n) => Math.max(max, n.nutritionValue),
        -Infinity
      );
    }
  };

  const data1 = query(`
    SELECT c.id, udf.GetMaxNutritionValue(c.nutrients) AS MaxNutritionValue
    FROM c
    WHERE udf.GetMaxNutritionValue(c.nutrients) > 100
  `).exec(collection, { udf });

  const data2 = query(`
    SELECT TOP 1000 c.id, MaxNutritionValue
    FROM c
    JOIN (SELECT VALUE udf.GetMaxNutritionValue(c.nutrients)) MaxNutritionValue
    WHERE MaxNutritionValue > 100
  `).exec(collection, { udf });

  const data3 = query(`
    SELECT TOP 1000 c.id, m.MaxNutritionValue
    FROM c
    JOIN (SELECT udf.GetMaxNutritionValue(c.nutrients) AS MaxNutritionValue) m
    WHERE m.MaxNutritionValue > 100
  `).exec(collection, { udf });

  assert.deepStrictEqual(data1, data2);
  assert.deepStrictEqual(data1, data3);

  assert.deepStrictEqual(data1.result, [
    { id: "00002", MaxNutritionValue: 101 },
    { id: "00003", MaxNutritionValue: 102 }
  ]);
};

export const evaluateOnceAndReferenceManyTimes2 = () => {
  const data = query(`
    SELECT TOP 1000 c.id, AvgNutritionValue
    FROM c
    JOIN (SELECT VALUE avg(n.nutritionValue) FROM n IN c.nutrients) AvgNutritionValue
    WHERE AvgNutritionValue > 80
  `).exec(collection);

  assert.deepStrictEqual(data.result, [{ id: "00003", AvgNutritionValue: 86 }]);
};

export const mimicJoinWithExternalReferenceData = () => {
  const data = query(`
    SELECT TOP 10 n.id, n.description, n.nutritionValue, n.units, r.name
    FROM food
    JOIN n IN food.nutrients
    JOIN r IN (
        SELECT VALUE [
            {unit: 'ng', name: 'nanogram', multiplier: 0.000000001, baseUnit: 'gram'},
            {unit: 'µg', name: 'microgram', multiplier: 0.000001, baseUnit: 'gram'},
            {unit: 'mg', name: 'milligram', multiplier: 0.001, baseUnit: 'gram'},
            {unit: 'g', name: 'gram', multiplier: 1, baseUnit: 'gram'},
            {unit: 'kg', name: 'kilogram', multiplier: 1000, baseUnit: 'gram'},
            {unit: 'Mg', name: 'megagram', multiplier: 1000000, baseUnit: 'gram'},
            {unit: 'Gg', name: 'gigagram', multiplier: 1000000000, baseUnit: 'gram'},
            {unit: 'nJ', name: 'nanojoule', multiplier: 0.000000001, baseUnit: 'joule'},
            {unit: 'µJ', name: 'microjoule', multiplier: 0.000001, baseUnit: 'joule'},
            {unit: 'mJ', name: 'millijoule', multiplier: 0.001, baseUnit: 'joule'},
            {unit: 'J', name: 'joule', multiplier: 1, baseUnit: 'joule'},
            {unit: 'kJ', name: 'kilojoule', multiplier: 1000, baseUnit: 'joule'},
            {unit: 'MJ', name: 'megajoule', multiplier: 1000000, baseUnit: 'joule'},
            {unit: 'GJ', name: 'gigajoule', multiplier: 1000000000, baseUnit: 'joule'},
            {unit: 'cal', name: 'calorie', multiplier: 1, baseUnit: 'calorie'},
            {unit: 'kcal', name: 'Calorie', multiplier: 1000, baseUnit: 'calorie'},
            {unit: 'IU', name: 'International units'}
        ]
    )
    WHERE n.units = r.unit
  `).exec(collection);

  assert.deepStrictEqual(data.result, [
    {
      id: "1",
      description: "A",
      nutritionValue: 1,
      units: "g",
      name: "gram"
    },
    {
      id: "1",
      description: "A",
      nutritionValue: 1,
      units: "g",
      name: "gram"
    },
    {
      id: "3",
      description: "C",
      nutritionValue: 101,
      units: "mg",
      name: "milligram"
    },
    {
      id: "4",
      description: "C",
      nutritionValue: 70,
      units: "mg",
      name: "milligram"
    },
    {
      id: "5",
      description: "D",
      nutritionValue: 102,
      units: "mg",
      name: "milligram"
    }
  ]);
};

export const simpleExpressionScalarSubqueries1 = () => {
  const data1 = query(`
    SELECT 1 AS a, 2 AS b
  `).exec(collection);

  const data2 = query(`
    SELECT (SELECT VALUE 1) AS a, (SELECT VALUE 2) AS b
  `).exec(collection);

  assert.deepStrictEqual(data1, data2);
  assert.deepStrictEqual(data1.result, [{ a: 1, b: 2 }]);
};

export const simpleExpressionScalarSubqueries2 = () => {
  const data1 = query(`
    SELECT TOP 5 Concat('id_', f.id) AS id
    FROM food f
  `).exec(collection);

  const data2 = query(`
    SELECT TOP 5 (SELECT VALUE Concat('id_', f.id)) AS id
    FROM food f
  `).exec(collection);

  assert.deepStrictEqual(data1, data2);
  assert.deepStrictEqual(data1.result, [
    { id: "id_00001" },
    { id: "id_00002" },
    { id: "id_00003" }
  ]);
};

export const simpleExpressionScalarSubqueries3 = () => {
  const data1 = query(`
    SELECT TOP 5 f.id, Contains(f.description, 'fruit') = true ? f.description : undefined
    FROM food f
  `).exec(collection);

  // NOTE: The document says "You can rewrite this query" but they're a bit different
  assert.deepStrictEqual(data1.result, [
    { id: "00001" },
    { id: "00002", $1: "fruit, infant formula" },
    { id: "00003" }
  ]);

  const data2 = query(`
    SELECT TOP 10 f.id, (SELECT f.description WHERE Contains(f.description, 'fruit')).description
    FROM food f
  `).exec(collection);

  assert.deepStrictEqual(data2.result, [
    { id: "00001" },
    { id: "00002", description: "fruit, infant formula" },
    { id: "00003" }
  ]);
};

export const aggregateScalarSubqueries1 = () => {
  const data = query(`
    SELECT TOP 5
      f.id,
      (SELECT VALUE Count(1) FROM n IN f.nutrients WHERE n.units = 'mg'
    ) AS count_mg
    FROM food f
  `).exec(collection);

  assert.deepStrictEqual(data.result, [
    { id: "00001", count_mg: 0 },
    { id: "00002", count_mg: 1 },
    { id: "00003", count_mg: 2 }
  ]);
};

export const aggregateScalarSubqueries2 = () => {
  const data = query(`
    SELECT TOP 5 f.id, (
      SELECT Count(1) AS count, Sum(n.nutritionValue) AS sum
      FROM n IN f.nutrients
      WHERE n.units = 'mg'
    ) AS unit_mg
    FROM food f
  `).exec(collection);

  assert.deepStrictEqual(data.result, [
    { id: "00001", unit_mg: { count: 0, sum: 0 } },
    { id: "00002", unit_mg: { count: 1, sum: 101 } },
    { id: "00003", unit_mg: { count: 2, sum: 172 } }
  ]);
};

export const aggregateScalarSubqueries3 = () => {
  const data1 = query(`
    SELECT TOP 5
      f.id,
      (SELECT VALUE Count(1) FROM n IN f.nutrients WHERE n.units = 'mg') AS count_mg
    FROM food f
    WHERE (SELECT VALUE Count(1) FROM n IN f.nutrients WHERE n.units = 'mg') > 1
  `).exec(collection);

  const data2 = query(`
    SELECT TOP 5 f.id, count_mg
    FROM food f
    JOIN (SELECT VALUE Count(1) FROM n IN f.nutrients WHERE n.units = 'mg') AS count_mg
    WHERE count_mg > 1
  `).exec(collection);

  assert.deepStrictEqual(data1, data2);
  assert.deepStrictEqual(data1.result, [{ id: "00003", count_mg: 2 }]);
};
