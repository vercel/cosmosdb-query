// @flow
const { default: generate } = require("@babel/generator");
const execute = require("./executor");
// $FlowFixMe
const { parse } = require("./parser"); // eslint-disable-line import/no-unresolved
const transform = require("./transformer");

module.exports = (
  coll: any[],
  {
    query,
    parameters
  }: { query: string, parameters?: { name: string, value: string }[] }
) => {
  const sqlAst = parse(query.trim());
  const jsAst = transform(sqlAst);
  const { code } = generate(jsAst);
  return execute(coll, { code, parameters });
};
