// @flow
/* eslint-disable no-underscore-dangle */
const { default: generate } = require("@babel/generator");
const containsPartitionKeys = require("./contains-partition-keys");
const execute = require("./executor");
// $FlowFixMe
const { parse } = require("./parser"); // eslint-disable-line import/no-unresolved
const transform = require("./transformer");

class Query {
  _query: string;

  _code: ?string;

  ast: Object;

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

  exec(coll: {}[], parameters?: { name: string, value: any }[]) {
    const { code } = this;
    if (!code) {
      throw new Error("Missing code");
    }

    return execute(coll, { code, parameters });
  }

  containsPartitionKeys(paths: string[]) {
    return containsPartitionKeys(this.ast, paths);
  }
}

module.exports = (query: string) => new Query(query);
