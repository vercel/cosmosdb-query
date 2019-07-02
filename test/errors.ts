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

export const multipleOrderByItems = testQuery(
  [],
  {
    query: "select c.id from c order by c.a, c.b"
  },
  new Error(
    "Multiple order-by items are not supported. Please specify a single order-by items."
  )
);

export const asteriskIsOnlyValidWithSingleInputSet = testQuery(
  [],
  {
    query: "select * from c join d in c.children"
  },
  new SyntaxError("'SELECT *' is only valid with a single input set.")
);

export const asteriskIsNotValidIfFromClauseIsOmitted = testQuery(
  [],
  {
    query: "select *"
  },
  new SyntaxError("'SELECT *' is not valid if FROM clause is omitted.")
);
