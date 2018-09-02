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

  _ast: ?Object;

  _code: ?string;

  constructor(query: string) {
    this._query = query;
    this._ast = null;
    this._code = null;
  }

  get ast() {
    if (!this._ast) {
      this._ast = parse(this._query.trim());
    }
    return this._ast;
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
    return execute(coll, { code, parameters });
  }

  containsPartitionKeys(paths: string[]) {
    if (!this.ast.where) return false;
    return containsPartitionKeys(this.ast.where.condition, paths);
  }
}

module.exports = (query: string) => new Query(query);
