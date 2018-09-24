// @flow
const testQuery = require("./utils/test-query");

exports.functionWrongNumberOfArgument = testQuery(
  null,
  {
    query: "select ABS()"
  },
  new Error("The ABS function requires 1 argument(s)")
);

exports.reserved = testQuery(
  [],
  {
    query: "select c.value from c"
  },
  SyntaxError
);
