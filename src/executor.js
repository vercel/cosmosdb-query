// @flow
const aggregateFunctions = require("./aggregate-functions");
const builtinFunctions = require("./builtin-functions");

module.exports = (
  collection: any[],
  {
    code,
    parameters
  }: { code: string, parameters?: { name: string, value: any }[] }
) => {
  // eslint-disable-next-line no-new-func
  const execute = new Function(`"use strict";return (${code})`)();

  const params = {};
  (parameters || []).forEach(({ name, value }) => {
    params[name.slice(1)] = value;
  });

  // $FlowFixMe
  return execute(aggregateFunctions, builtinFunctions, collection, params);
};
