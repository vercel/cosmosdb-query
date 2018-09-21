// @flow
const aggregateFunctions = require("./aggregate-functions");
const builtinFunctions = require("./builtin-functions");

function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    // remove `undefined` from array unlike JSON
    return obj.reduce(
      (o, v) => (typeof v !== "undefined" ? [...o, removeUndefined(v)] : o),
      []
    );
  }

  if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((o, [k, v]) => {
      if (typeof v !== "undefined") {
        // eslint-disable-next-line no-param-reassign
        o[k] = removeUndefined(v);
      }
      return o;
    }, {});
  }

  return obj;
}

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
  const result = execute(
    aggregateFunctions,
    builtinFunctions,
    collection,
    params
  );
  return result.map(removeUndefined);
};
