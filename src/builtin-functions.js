// @flow

exports.ABS = (v: number) => Math.abs(v);

exports.ARRAY_CONCAT = (...a: Array<any[]>) =>
  a.reduce((b, c) => [...b, ...c], []);

exports.ARRAY_CONTAINS = (a: any[], c: any) =>
  a.some(
    i =>
      exports.IS_OBJECT(c) ? Object.keys(c).every(k => i[k] === c[k]) : i === c
  );

exports.ARRAY_LENGTH = (a: any[]) => a.length;

exports.ARRAY_SLICE = (a: any[], b: number, c?: number) =>
  // $FlowFixMe
  a.slice(b, c != null ? b + c : undefined);

exports.CEILING = (v: number) => Math.ceil(v);

exports.CONCAT = (...a: string[]) => a.join("");

exports.CONTAINS = (a: string, b: string) => a.includes(b);

exports.FLOOR = (v: number) => Math.floor(v);

exports.INDEX_OF = (a: string, b: string) => a.indexOf(b);

exports.IS_ARRAY = (v: any) => Array.isArray(v);

exports.IS_BOOL = (v: any) => typeof v === "boolean";

exports.IS_DEFINED = (v: any) => typeof v !== "undefined";

exports.IS_NULL = (v: any) => v === null;

exports.IS_NUMBER = (v: any) => typeof v === "number";

exports.IS_OBJECT = (v: any) =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);

exports.IS_PRIMITIVE = (v: any) =>
  exports.IS_NULL(v) ||
  exports.IS_NUMBER(v) ||
  exports.IS_STRING(v) ||
  exports.IS_BOOL(v);

exports.IS_STRING = (v: any) => typeof v === "string";

exports.LENGTH = (v: string) => v.length;

exports.LOWER = (v: string) => v.toLowerCase();

exports.REVERSE = (v: string) =>
  v
    .split("")
    .reverse()
    .join("");

exports.ROUND = (v: number) => Math.round(v);

exports.STARTSWITH = (a: string, b: string) => a.startsWith(b);

exports.SUBSTRING = (a: string, b: number, c?: number) =>
  a.substring(b, c != null ? b + c : undefined);

exports.ToString = (v?: number | string | boolean) =>
  typeof v === "undefined" ? undefined : String(v);

exports.TRIM = (v: string) => v.trim();

exports.UPPER = (v: string) => v.toUpperCase();
