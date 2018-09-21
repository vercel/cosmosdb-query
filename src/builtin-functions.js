// @flow

const ifDefined = f => (...a: any[]) =>
  a.every(v => typeof v !== "undefined") ? f(...a) : undefined;

exports.ABS = ifDefined((v: number) => Math.abs(v));

exports.ACOS = ifDefined((v: number) => Math.acos(v));

exports.ARRAY_CONCAT = ifDefined((...a: Array<any[]>) =>
  a.reduce((b, c) => [...b, ...c], [])
);

exports.ARRAY_CONTAINS = ifDefined((a: any[], c: any) =>
  a.some(
    i =>
      exports.IS_OBJECT(c) ? Object.keys(c).every(k => i[k] === c[k]) : i === c
  )
);

exports.ARRAY_LENGTH = ifDefined((a: any[]) => a.length);

exports.ARRAY_SLICE = ifDefined((a: any[], b: number, c?: number) =>
  // $FlowFixMe
  a.slice(b, c != null ? b + c : undefined)
);

exports.ASIN = ifDefined((v: number) => Math.asin(v));

exports.ATAN = ifDefined((v: number) => Math.atan(v));

exports.ATN2 = ifDefined((a: number, b: number) => Math.atan2(b, a));

exports.CEILING = ifDefined((v: number) => Math.ceil(v));

exports.CONCAT = ifDefined((...a: string[]) => a.join(""));

exports.CONTAINS = ifDefined((a: string, b: string) => a.includes(b));

exports.COS = ifDefined((v: number) => Math.cos(v));

exports.COT = ifDefined((v: number) => 1 / Math.tan(v));

exports.DEGREES = ifDefined((v: number) => (v * 180) / Math.PI);

exports.ENDSWITH = ifDefined((a: string, b: string) => a.endsWith(b));

exports.EXP = ifDefined((v: number) => Math.exp(v));

exports.FLOOR = ifDefined((v: number) => Math.floor(v));

exports.INDEX_OF = ifDefined((a: string, b: string) => a.indexOf(b));

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

exports.LEFT = ifDefined((a: string, b: number) => a.slice(0, b));

exports.LENGTH = ifDefined((v: string) => v.length);

exports.LOG = ifDefined((v: number) => Math.log(v));

exports.LOG10 = ifDefined((v: number) => Math.log10(v));

exports.LOWER = ifDefined((v: string) => v.toLowerCase());

exports.LTRIM = ifDefined((v: string) => v.trimLeft());

exports.PI = () => Math.PI;

exports.POWER = ifDefined((a: number, b: number) => a ** b);

exports.RADIANS = ifDefined((v: number) => (v * Math.PI) / 180);

exports.REPLACE = ifDefined((a: string, b: string, c: string) =>
  a.replace(b, c)
);

exports.REPLICATE = ifDefined((a: string, b: number) => a.repeat(b));

exports.REVERSE = ifDefined((v: string) =>
  v
    .split("")
    .reverse()
    .join("")
);

exports.RIGHT = ifDefined((a: string, b: number) => a.slice(-b));

exports.ROUND = ifDefined((v: number) => Math.round(v));

exports.RTRIM = ifDefined((v: string) => v.trimRight());

exports.SIGN = ifDefined((v: number) => Math.sign(v));

exports.SIN = ifDefined((v: number) => Math.sin(v));

exports.SQRT = ifDefined((v: number) => Math.sqrt(v));

exports.SQUARE = ifDefined((v: number) => v ** 2);

exports.STARTSWITH = ifDefined((a: string, b: string) => a.startsWith(b));

exports.SUBSTRING = ifDefined((a: string, b: number, c?: number) =>
  a.substring(b, c != null ? b + c : undefined)
);

exports.TAN = ifDefined((v: number) => Math.tan(v));

exports.ToString = ifDefined((v?: number | string | boolean) => String(v));

exports.TRIM = ifDefined((v: string) => v.trim());

exports.TRUNC = ifDefined((v: number) => Math.trunc(v));

exports.UPPER = ifDefined((v: string) => v.toUpperCase());
