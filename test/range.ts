import testQuery from "./utils/test-query";

// eslint-disable-next-line import/prefer-default-export
export const root = testQuery(
  [
    {
      id: 1,
      ts: 1
    },
    {
      id: 2,
      ts: 2
    },
    {
      id: 3,
      ts: 3
    }
  ],
  {
    query: "SELECT * FROM c WHERE c.ts < @a AND c.ts > @b",
    parameters: [{ name: "@a", value: 3 }, { name: "@b", value: 1 }]
  },
  [
    {
      id: 2,
      ts: 2
    }
  ]
);
