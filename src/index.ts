/* eslint-disable no-underscore-dangle */
import generate from "@babel/generator";
import containsPartitionKeys from "./contains-partition-keys";
import execute from "./executor";
// @ts-ignore
import { parse } from "./parser"; // eslint-disable-line import/no-unresolved
import transform from "./transformer";

class Query {
  _query: string;

  _code: string | undefined | null;

  ast: {
    [x: string]: any;
  };

  constructor(query: string) {
    this._query = query;
    this._code = null;
    this.ast = parse(this._query.trim());
  }

  get code() {
    if (!this._code) {
      const jsAst = transform(this.ast);
      const { code } = generate(jsAst);
      this._code = code;
    }
    return this._code;
  }

  exec(
    coll: {}[],
    {
      parameters,
      udf
    }: {
      parameters?: {
        name: string;
        value: any;
      }[];
      udf?: {
        [x: string]: any;
      };
    } = {}
  ) {
    const { code } = this;
    if (!code) {
      throw new Error("Missing code");
    }

    return execute(coll, { code, parameters, udf });
  }

  containsPartitionKeys(paths: string[]) {
    return containsPartitionKeys(this.ast, paths);
  }
}

export default (query: string) => new Query(query);
