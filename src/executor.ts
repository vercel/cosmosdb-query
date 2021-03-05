import * as aggregateFunctions from "./aggregate-functions";
import * as builtinFunctions from "./builtin-functions";
import * as helpers from "./helpers";
// eslint-disable-next-line no-unused-vars
import { CompositeIndex } from "./types";

export default (
  collection: any[],
  {
    code,
    parameters,
    udf = {},
    maxItemCount,
    continuation,
    compositeIndexes
  }: {
    code: string;
    parameters?: {
      name: string;
      value: any;
    }[];
    udf?: {
      [x: string]: any;
    };
    maxItemCount?: number;
    continuation?: {
      token: string;
    };
    compositeIndexes?: CompositeIndex[][];
  }
) => {
  // eslint-disable-next-line no-new-func
  const execute = new Function(`"use strict";return (${code})`)();

  const params: { [x: string]: any } = {};
  (parameters || []).forEach(({ name, value }) => {
    params[name.slice(1)] = value;
  });

  return execute(
    aggregateFunctions,
    builtinFunctions,
    collection,
    helpers,
    udf,
    params,
    maxItemCount,
    continuation,
    compositeIndexes
  );
};
