import testQuery from "./utils/test-query";
import { SyntaxError } from "../lib";

export const functionWrongNumberOfArgument = testQuery(
  null,
  {
    query: "select ABS()"
  },
  new SyntaxError("The ABS function requires 1 argument(s)")
);

export const reserved = testQuery(
  [],
  {
    query: "select c.value from c"
  },
  SyntaxError
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

export const cardinalityOfScalarSubqueryResultSetCannotBeGreaterThenOne = testQuery(
  [],
  {
    query: "select (select l from l in c.list) from c"
  },
  new SyntaxError(
    "The cardinality of a scalar subquery result set cannot be greater than one."
  )
);

export const multipleOrderByWithoutCompositeIndexes = testQuery(
  [],
  {
    query: "SELECT c.id FROM c ORDER BY c.a, c.b DESC",
    compositeIndexes: []
  },
  new Error(
    "The order by query does not have a corresponding composite index that it can be served from."
  )
);

export const multipleOrderByWithoutCorrespondingCompositeIndexes1 = testQuery(
  [],
  {
    query: "SELECT c.id FROM c ORDER BY c.a, c.b DESC",
    compositeIndexes: [
      [{ path: "/a", order: "ascending" }, { path: "/b", order: "ascending" }]
    ]
  },
  new Error(
    "The order by query does not have a corresponding composite index that it can be served from."
  )
);

export const multipleOrderByWithoutCorrespondingCompositeIndexes2 = testQuery(
  [],
  {
    query: "SELECT c.id FROM c ORDER BY c.a, c.b DESC",
    compositeIndexes: [
      [{ path: "/b", order: "descending" }, { path: "/a", order: "ascending" }]
    ]
  },
  new Error(
    "The order by query does not have a corresponding composite index that it can be served from."
  )
);
