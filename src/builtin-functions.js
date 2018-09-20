// @flow

exports.ABS = (v: number) => Math.abs(v);

exports.ACOS = (v: number) => Math.acos(v);

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

exports.ASIN = (v: number) => Math.asin(v);

exports.ATAN = (v: number) => Math.atan(v);

exports.ATN2 = (a: number, b: number) => Math.atan2(b, a);

exports.CEILING = (v: number) => Math.ceil(v);

exports.CONCAT = (...a: string[]) => a.join("");

exports.CONTAINS = (a: string, b: string) => a.includes(b);

exports.COS = (v: number) => Math.cos(v);

exports.COT = (v: number) => 1 / Math.tan(v);

exports.DEGREES = (v: number) => (v * 180) / Math.PI;

exports.ENDSWITH = (a: string, b: string) => a.endsWith(b);

exports.EXP = (v: number) => Math.exp(v);

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

exports.LEFT = (a: string, b: number) => a.slice(0, b);

exports.LENGTH = (v: string) => v.length;

exports.LOG = (v: number) => Math.log(v);

exports.LOG10 = (v: number) => Math.log10(v);

exports.LOWER = (v: string) => v.toLowerCase();

exports.LTRIM = (v: string) => v.trimLeft();

exports.PI = () => Math.PI;

exports.POWER = (a: number, b: number) => a ** b;

exports.RADIANS = (v: number) => (v * Math.PI) / 180;

exports.REPLACE = (a: string, b: string, c: string) => a.replace(b, c);

exports.REPLICATE = (a: string, b: number) => a.repeat(b);

exports.REVERSE = (v: string) =>
  v
    .split("")
    .reverse()
    .join("");

exports.RIGHT = (a: string, b: number) => a.slice(-b);

exports.ROUND = (v: number) => Math.round(v);

exports.RTRIM = (v: string) => v.trimRight();

exports.SIGN = (v: number) => Math.sign(v);

exports.SIN = (v: number) => Math.sin(v);

exports.SQRT = (v: number) => Math.sqrt(v);

exports.SQUARE = (v: number) => v ** 2;

exports.STARTSWITH = (a: string, b: string) => a.startsWith(b);

exports.SUBSTRING = (a: string, b: number, c?: number) =>
  a.substring(b, c != null ? b + c : undefined);

exports.TAN = (v: number) => Math.tan(v);

exports.ToString = (v?: number | string | boolean) =>
  typeof v === "undefined" ? undefined : String(v);

exports.TRIM = (v: string) => v.trim();

exports.TRUNC = (v: number) => Math.trunc(v);

exports.UPPER = (v: string) => v.toUpperCase();
