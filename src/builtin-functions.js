// @flow

const typeOf = (v: any) => {
  const t = typeof v;
  if (t !== "object") return t;
  if (v === null) return "null";
  return Array.isArray(v) ? "array" : t;
};

const def = (name: string, argTypes: any[], f) => {
  const lastType = argTypes[argTypes.length - 1];
  const variableType = lastType && lastType.variable ? lastType : null;
  const types = (variableType ? argTypes.slice(0, -1) : argTypes).map(
    t => (typeof t === "string" ? { type: t, optional: false } : t)
  );
  const requiredTypes = types.filter(t => !t.optional);
  const isVariable = variableType || requiredTypes.length !== types.length;

  return function fn(...a: any[]) {
    if (
      isVariable
        ? a.length < requiredTypes.length
        : a.length !== requiredTypes.length
    ) {
      throw new Error(
        `The ${name} function requires ${isVariable ? "at least " : ""}${
          requiredTypes.length
        } argument(s)`
      );
    }
    if (
      !types.every(
        (t, i) =>
          t.type === "any" ||
          typeOf(a[i]) === t.type ||
          (typeOf(a[i]) === "undefined" && t.optional)
      )
    ) {
      return undefined;
    }
    if (
      variableType &&
      variableType.type !== "any" &&
      !a.slice(types.length).every(v => typeOf(v) === variableType.type)
    ) {
      return undefined;
    }
    return f(...a);
  };
};

const deepEqual = (a: any, b: any, partial: boolean) => {
  const typeOfA = typeOf(a);
  const typeOfB = typeOf(b);

  if (typeOfA === "array" && typeOfB === "array") {
    if ((a: Array<any>).length !== (b: Array<any>).length) return false;
    return a.every((v, i) => deepEqual(v, b[i], partial));
  }

  if (typeOfA === "object" && typeOfB === "object") {
    const aEntries = Object.entries(a);
    const bEntries = Object.entries(b);
    if (!partial && aEntries.length !== bEntries.length) return false;
    return bEntries.every(([k, v]) => deepEqual(a[k], v, partial));
  }

  return a === b;
};

exports.ABS = def("ABS", ["number"], (v: number) => Math.abs(v));

exports.ACOS = def("ACOS", ["number"], (v: number) => Math.acos(v));

exports.ARRAY_CONCAT = def(
  "ARRAY_CONCAT",
  ["array", "array", { type: "array", variable: true }],
  (...a: Array<any[]>) => a.reduce((b, c) => [...b, ...c], [])
);

exports.ARRAY_CONTAINS = def(
  "ARRAY_CONTAINS",
  ["array", "any", { type: "boolean", optional: true }],
  (a: any[], c: any, partial?: boolean = false) =>
    a.some(v => deepEqual(v, c, partial))
);

exports.ARRAY_LENGTH = def("ARRAY_LENGTH", ["array"], (a: any[]) => a.length);

exports.ARRAY_SLICE = def(
  "ARRAY_SLICE",
  ["array", "number", { type: "number", optional: true }],
  (a: any[], b: number, c?: number) =>
    // $FlowFixMe
    a.slice(b, c != null ? b + c : undefined)
);

exports.ASIN = def("ASIN", ["number"], (v: number) => Math.asin(v));

exports.ATAN = def("ATAN", ["number"], (v: number) => Math.atan(v));

exports.ATN2 = def("ASN2", ["number", "number"], (a: number, b: number) =>
  Math.atan2(b, a)
);

exports.CEILING = def("CEILING", ["number"], (v: number) => Math.ceil(v));

exports.CONCAT = def(
  "CONCAT",
  ["string", "string", { type: "string", variable: true }],
  (...a: string[]) => a.join("")
);

exports.CONTAINS = def(
  "CONTAINS",
  ["string", "string"],
  (a: string, b: string) => a.includes(b)
);

exports.COS = def("COS", ["number"], (v: number) => Math.cos(v));

exports.COT = def("COT", ["number"], (v: number) => 1 / Math.tan(v));

exports.DEGREES = def(
  "DEGREES",
  ["number"],
  (v: number) => (v * 180) / Math.PI
);

exports.ENDSWITH = def(
  "ENDSWITH",
  ["string", "string"],
  (a: string, b: string) => a.endsWith(b)
);

exports.EXP = def("EXP", ["number"], (v: number) => Math.exp(v));

exports.FLOOR = def("FLOOR", ["number"], (v: number) => Math.floor(v));

exports.INDEX_OF = def(
  "INDEX_OF",
  ["string", "string"],
  (a: string, b: string) => a.indexOf(b)
);

exports.IS_ARRAY = def("IS_ARRAY", ["any"], (v: any) => Array.isArray(v));

exports.IS_BOOL = def("IS_BOOL", ["any"], (v: any) => typeof v === "boolean");

exports.IS_DEFINED = def(
  "IS_DEFINED",
  ["any"],
  (v: any) => typeof v !== "undefined"
);

exports.IS_NULL = def("IS_NULL", ["any"], (v: any) => v === null);

exports.IS_NUMBER = def(
  "IS_NUMBER",
  ["any"],
  (v: any) => typeof v === "number"
);

exports.IS_OBJECT = def(
  "IS_OBJECT",
  ["any"],
  (v: any) => Boolean(v) && typeof v === "object" && !Array.isArray(v)
);

exports.IS_PRIMITIVE = def(
  "IS_PRIMITIVE",
  ["any"],
  (v: any) =>
    exports.IS_NULL(v) ||
    exports.IS_NUMBER(v) ||
    exports.IS_STRING(v) ||
    exports.IS_BOOL(v)
);

exports.IS_STRING = def(
  "IS_STRING",
  ["any"],
  (v: any) => typeof v === "string"
);

exports.LEFT = def("LEFT", ["string", "number"], (a: string, b: number) =>
  a.slice(0, b)
);

exports.LENGTH = def("LENGTH", ["string"], (v: string) => v.length);

exports.LOG = def("LOG", ["number"], (v: number) => Math.log(v));

exports.LOG10 = def("LOG10", ["number"], (v: number) => Math.log10(v));

exports.LOWER = def("LOWER", ["string"], (v: string) => v.toLowerCase());

exports.LTRIM = def("LTRIM", ["string"], (v: string) => v.trimLeft());

exports.PI = def("PI", [], () => Math.PI);

exports.POWER = def(
  "POWER",
  ["number", "number"],
  (a: number, b: number) => a ** b
);

exports.RADIANS = def(
  "RADIANS",
  ["number"],
  (v: number) => (v * Math.PI) / 180
);

exports.REPLACE = def(
  "REPLACE",
  ["string", "string", "string"],
  (a: string, b: string, c: string) => a.replace(b, c)
);

exports.REPLICATE = def(
  "REPLICATE",
  ["string", "number"],
  (a: string, b: number) => a.repeat(b)
);

exports.REVERSE = def("REVERSE", ["string"], (v: string) =>
  v
    .split("")
    .reverse()
    .join("")
);

exports.RIGHT = def("RIGHT", ["string", "number"], (a: string, b: number) =>
  a.slice(-b)
);

exports.ROUND = def("ROUND", ["number"], (v: number) => Math.round(v));

exports.RTRIM = def("RTRIM", ["string"], (v: string) => v.trimRight());

exports.SIGN = def("SIGN", ["number"], (v: number) => Math.sign(v));

exports.SIN = def("SIN", ["number"], (v: number) => Math.sin(v));

exports.SQRT = def("SQRT", ["number"], (v: number) => Math.sqrt(v));

exports.SQUARE = def("SQUARE", ["number"], (v: number) => v ** 2);

exports.STARTSWITH = def(
  "STARTSWITH",
  ["string", "string"],
  (a: string, b: string) => a.startsWith(b)
);

exports.SUBSTRING = def(
  "SUBSTRING",
  ["string", "number", { type: "number", optional: true }],
  (a: string, b: number, c?: number) =>
    a.substring(b, c != null ? b + c : undefined)
);

exports.TAN = def("TAN", ["number"], (v: number) => Math.tan(v));

exports.TOSTRING = def("ToString", ["any"], (v?: number | string | boolean) => {
  const t = typeOf(v);
  if (t === "undefined") {
    return undefined;
  }
  if (t === "object" || t === "array") {
    JSON.stringify(v);
  }
  return String(v);
});

exports.TRIM = def("TRIM", ["string"], (v: string) => v.trim());

exports.TRUNC = def("TRUNC", ["number"], (v: number) => Math.trunc(v));

exports.UPPER = def("UPPER", ["string"], (v: string) => v.toUpperCase());
