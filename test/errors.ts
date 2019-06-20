import testQuery from "./utils/test-query";

export const functionWrongNumberOfArgument = testQuery(
  null,
  {
    query: "select ABS()"
  },
  new Error("The ABS function requires 1 argument(s)")
);

export const reserved = testQuery(
  [],
  {
    query: "select c.value from c"
  },
  SyntaxError
);
