import {
  booleanDisjoint,
  centroid,
  feature,
  distance,
  booleanWithin,
  // eslint-disable-next-line no-unused-vars
  Feature
} from "@turf/turf";

// @ts-ignore
import { SyntaxError } from "./parser"; // eslint-disable-line import/no-unresolved

const typeOf = (v: any) => {
  const t = typeof v;
  if (t !== "object") return t;
  if (v === null) return "null";
  return Array.isArray(v) ? "array" : t;
};

const def = (name: string, argTypes: any[], f: Function) => {
  const lastType = argTypes[argTypes.length - 1];
  const variableType = lastType && lastType.variable ? lastType : null;
  const types = (variableType ? argTypes.slice(0, -1) : argTypes).map(t =>
    typeof t === "string" ? { type: t, optional: false } : t
  );
  const requiredTypes = types.filter(t => !t.optional);
  const isVariable = variableType || requiredTypes.length !== types.length;

  return function fn(...a: any[]) {
    if (
      isVariable
        ? a.length < requiredTypes.length
        : a.length !== requiredTypes.length
    ) {
      throw new SyntaxError(
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

const deepEqual = (a: any, b: any, partial: boolean): boolean => {
  const typeOfA = typeOf(a);
  const typeOfB = typeOf(b);

  if (typeOfA === "array" && typeOfB === "array") {
    if ((a as Array<any>).length !== (b as Array<any>).length) return false;
    return a.every((v: any, i: number) => deepEqual(v, b[i], partial));
  }

  if (typeOfA === "object" && typeOfB === "object") {
    const aEntries = Object.entries(a);
    const bEntries = Object.entries(b);
    if (!partial && aEntries.length !== bEntries.length) return false;
    return bEntries.every(([k, v]) => deepEqual(a[k], v, partial));
  }

  return a === b;
};

export const ABS = def("ABS", ["number"], (v: number) => Math.abs(v));

export const ACOS = def("ACOS", ["number"], (v: number) => Math.acos(v));

export const ARRAY_CONCAT = def(
  "ARRAY_CONCAT",
  ["array", "array", { type: "array", variable: true }],
  (...a: Array<any[]>) => a.reduce((b, c) => [...b, ...c], [])
);

export const ARRAY_CONTAINS = def(
  "ARRAY_CONTAINS",
  ["array", "any", { type: "boolean", optional: true }],
  (a: any[], c: any, partial: boolean = false) =>
    a.some(v => deepEqual(v, c, partial))
);

export const ARRAY_LENGTH = def(
  "ARRAY_LENGTH",
  ["array"],
  (a: any[]) => a.length
);

export const ARRAY_SLICE = def(
  "ARRAY_SLICE",
  ["array", "number", { type: "number", optional: true }],
  (a: any[], b: number, c?: number) => a.slice(b, c != null ? b + c : undefined)
);

export const ASIN = def("ASIN", ["number"], (v: number) => Math.asin(v));

export const ATAN = def("ATAN", ["number"], (v: number) => Math.atan(v));

export const ATN2 = def("ASN2", ["number", "number"], (a: number, b: number) =>
  Math.atan2(b, a)
);

export const CEILING = def("CEILING", ["number"], (v: number) => Math.ceil(v));

export const CONCAT = def(
  "CONCAT",
  ["string", "string", { type: "string", variable: true }],
  (...a: string[]) => a.join("")
);

export const CONTAINS = def(
  "CONTAINS",
  ["string", "string"],
  (a: string, b: string) => a.includes(b)
);

export const COS = def("COS", ["number"], (v: number) => Math.cos(v));

export const COT = def("COT", ["number"], (v: number) => 1 / Math.tan(v));

export const DEGREES = def(
  "DEGREES",
  ["number"],
  (v: number) => (v * 180) / Math.PI
);

export const ENDSWITH = def(
  "ENDSWITH",
  ["string", "string"],
  (a: string, b: string) => a.endsWith(b)
);

export const EXP = def("EXP", ["number"], (v: number) => Math.exp(v));

export const FLOOR = def("FLOOR", ["number"], (v: number) => Math.floor(v));

export const INDEX_OF = def(
  "INDEX_OF",
  ["string", "string"],
  (a: string, b: string) => a.indexOf(b)
);

export const IS_ARRAY = def("IS_ARRAY", ["any"], (v: any) => Array.isArray(v));

export const IS_BOOL = def(
  "IS_BOOL",
  ["any"],
  (v: any) => typeof v === "boolean"
);

export const IS_DEFINED = def(
  "IS_DEFINED",
  ["any"],
  (v: any) => typeof v !== "undefined"
);

export const IS_NULL = def("IS_NULL", ["any"], (v: any) => v === null);

export const IS_NUMBER = def(
  "IS_NUMBER",
  ["any"],
  (v: any) => typeof v === "number"
);

export const IS_OBJECT = def(
  "IS_OBJECT",
  ["any"],
  (v: any) => Boolean(v) && typeof v === "object" && !Array.isArray(v)
);

export const IS_STRING = def(
  "IS_STRING",
  ["any"],
  (v: any) => typeof v === "string"
);

export const IS_PRIMITIVE = def(
  "IS_PRIMITIVE",
  ["any"],
  (v: any) => IS_NULL(v) || IS_NUMBER(v) || IS_STRING(v) || IS_BOOL(v)
);

export const LEFT = def("LEFT", ["string", "number"], (a: string, b: number) =>
  a.slice(0, b)
);

export const LENGTH = def("LENGTH", ["string"], (v: string) => v.length);

export const LOG = def("LOG", ["number"], (v: number) => Math.log(v));

export const LOG10 = def("LOG10", ["number"], (v: number) => Math.log10(v));

export const LOWER = def("LOWER", ["string"], (v: string) => v.toLowerCase());

export const LTRIM = def("LTRIM", ["string"], (v: string) => v.trimLeft());

export const PI = def("PI", [], () => Math.PI);

export const POWER = def(
  "POWER",
  ["number", "number"],
  (a: number, b: number) => a ** b
);

export const RADIANS = def(
  "RADIANS",
  ["number"],
  (v: number) => (v * Math.PI) / 180
);

export const REPLACE = def(
  "REPLACE",
  ["string", "string", "string"],
  (a: string, b: string, c: string) => a.replace(b, c)
);

export const REPLICATE = def(
  "REPLICATE",
  ["string", "number"],
  (a: string, b: number) => a.repeat(b)
);

export const REVERSE = def("REVERSE", ["string"], (v: string) =>
  v
    .split("")
    .reverse()
    .join("")
);

export const RIGHT = def(
  "RIGHT",
  ["string", "number"],
  (a: string, b: number) => a.slice(-b)
);

export const ROUND = def("ROUND", ["number"], (v: number) => Math.round(v));

export const RTRIM = def("RTRIM", ["string"], (v: string) => v.trimRight());

export const SIGN = def("SIGN", ["number"], (v: number) => Math.sign(v));

export const SIN = def("SIN", ["number"], (v: number) => Math.sin(v));

export const SQRT = def("SQRT", ["number"], (v: number) => Math.sqrt(v));

export const SQUARE = def("SQUARE", ["number"], (v: number) => v ** 2);

export const STARTSWITH = def(
  "STARTSWITH",
  ["string", "string"],
  (a: string, b: string) => a.startsWith(b)
);

export const SUBSTRING = def(
  "SUBSTRING",
  ["string", "number", { type: "number", optional: true }],
  (a: string, b: number, c?: number) =>
    a.substring(b, c != null ? b + c : undefined)
);

export const TAN = def("TAN", ["number"], (v: number) => Math.tan(v));

export const TOSTRING = def(
  "ToString",
  ["any"],
  (v?: number | string | boolean) => {
    const t = typeOf(v);
    if (t === "undefined") {
      return undefined;
    }
    if (t === "object" || t === "array") {
      return JSON.stringify(v);
    }
    return String(v);
  }
);

export const TRIM = def("TRIM", ["string"], (v: string) => v.trim());

export const TRUNC = def("TRUNC", ["number"], (v: number) => Math.trunc(v));

export const UPPER = def("UPPER", ["string"], (v: string) => v.toUpperCase());

// Spatial functions

const spatialBinaryOp = (name: string, f: Function) => {
  return def(name, ["any", "any"], (a: string | object, b: string | object) => {
    const t1 = typeOf(a);
    if (t1 === "undefined") {
      return undefined;
    }

    const aObj = t1 === "object" ? a : JSON.parse(a as string);

    const t2 = typeOf(a);
    if (t2 === "undefined") {
      return undefined;
    }
    const bObj = t1 === "object" ? b : JSON.parse(b as string);

    const aFeat = feature(aObj);
    const bFeat = feature(bObj);

    return f(aFeat, bFeat);
  });
};

export const ST_DISTANCE = spatialBinaryOp(
  "ST_DISTANCE",
  (a: Feature, b: Feature) => {
    // Turf can only handle point distances - take the centroid
    // as a workaround.
    const pa = centroid(a);
    const pb = centroid(b);

    // Convert kilometers to meters.
    return distance(pa.geometry.coordinates, pb.geometry.coordinates) * 1000;
  }
);

export const ST_WITHIN = spatialBinaryOp("ST_WITHIN", booleanWithin);

export const ST_INTERSECTS = spatialBinaryOp(
  "ST_INTERSECTS",
  (a: Feature, b: Feature) => !booleanDisjoint(a, b)
);

export const REGEXMATCH = def(
  "REGEXMATCH",
  ["string", "string", { type: "string", optional: true }],
  (str: string, p: string, f?: string) => {
    let pattern = p;
    let flags = f;
    if (flags) {
      if (!/^[msix]+$/.test(flags)) {
        throw new Error(`Unexpectd flags on REGEXMATCH: ${flags}`);
      }

      if (flags.includes("x")) {
        pattern = pattern.replace(/\s/g, "");
        flags = flags.replace(/x/g, "");
      }
    }

    // TODO: cache RegExp instances?
    const re = new RegExp(pattern, flags);
    return re.test(str);
  }
);
