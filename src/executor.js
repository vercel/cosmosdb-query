// @flow
const aggregateFunctions = require("./aggregate-functions");
const builtinFunctions = require("./builtin-functions");
const helpers = require("./helpers");

module.exports = (
  collection: any[],
  {
    code,
    parameters,
    udf
  }: {
    code: string,
    parameters?: { name: string, value: any }[],
    udf?: Object
  }
) => {
  // eslint-disable-next-line no-new-func
  const execute = new Function(`"use strict";return (${code})`)();

  const params = {};
  (parameters || []).forEach(({ name, value }) => {
    params[name.slice(1)] = value;
  });

  // $FlowFixMe
  return execute(
    aggregateFunctions,
    builtinFunctions,
    collection,
    helpers,
    udf,
    params
  );
};
