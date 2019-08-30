import * as continuationToken from "./continuation-token";

const TYPE_ORDERS = new Set(["boolean", "null", "string", "number"]);

const typeOf = (v: any) => {
  const t = typeof v;
  if (t !== "object") return t;
  if (v === null) return "null";
  return Array.isArray(v) ? "array" : t;
};

const equalTypes = (a: any, b: any) => {
  const typeOfA = typeOf(a);
  const typeOfB = typeOf(b);
  return typeOfA === typeOfB && typeOfA !== "undefined";
};

const deepEqual = (a: any, b: any): boolean => {
  const typeOfA = typeOf(a);
  const typeOfB = typeOf(b);

  if (typeOfA === "array" && typeOfB === "array") {
    if ((a as Array<any>).length !== (b as Array<any>).length) return false;
    return a.every((v: any, i: number) => deepEqual(v, b[i]));
  }

  if (typeOfA === "object" && typeOfB === "object") {
    const aEntries = Object.entries(a);
    const bEntries = Object.entries(b);
    if (aEntries.length !== bEntries.length) return false;
    return aEntries.every(([k, v]) => deepEqual(v, b[k]));
  }

  return a === b;
};

const comparator = (a: any, b: any) => {
  if (a === b) return 0;

  const aType = typeOf(a);
  const bType = typeOf(b);

  if (aType === bType) {
    if (!TYPE_ORDERS.has(aType)) return 0;
    return a < b ? -1 : 1;
  }

  const typeOrders = [...TYPE_ORDERS];
  for (let i = 0; i < typeOrders.length; i += 1) {
    if (aType === typeOrders[i]) return -1;
    if (bType === typeOrders[i]) return 1;
  }

  return 0;
};

export const stripUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    // remove `undefined` from array unlike JSON
    return obj.reduce(
      (o, v) => (typeof v !== "undefined" ? [...o, stripUndefined(v)] : o),
      []
    );
  }

  if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce(
      (o, [k, v]) => {
        if (typeof v !== "undefined") {
          // eslint-disable-next-line no-param-reassign
          o[k] = stripUndefined(v);
        }
        return o;
      },
      {} as any
    );
  }

  return obj;
};

export const equal = (a: any, b: any) => {
  if (!equalTypes(a, b)) {
    return undefined;
  }

  return deepEqual(a, b);
};

export const notEqual = (a: any, b: any) => {
  const eq = equal(a, b);
  return typeof eq !== "undefined" ? !eq : eq;
};

export const compare = (operator: string, a: any, b: any) => {
  if (!equalTypes(a, b)) {
    return undefined;
  }

  const typeOfA = typeOf(a);
  if (typeOfA === "object" || typeOfA === "array") {
    return undefined;
  }

  switch (operator) {
    case ">":
      return a > b;
    case ">=":
      return a >= b;
    case "<":
      return a < b;
    case "<=":
      return a <= b;
    default:
      throw new TypeError(`Unexpected operator: ${operator}`);
  }
};

export const and = (a: any, b: any) => {
  if (typeof a !== "boolean" || typeof b !== "boolean") {
    return a === false || b === false ? false : undefined;
  }

  return a && b;
};

export const or = (a: any, b: any) => {
  if (typeof a !== "boolean" || typeof b !== "boolean") {
    return a === true || b === true ? true : undefined;
  }

  return a || b;
};

export const not = (v: any) => (typeof v === "boolean" ? !v : undefined);

export const calculate = (operator: string, a: any, b: any) => {
  if (typeof a !== "number" || typeof b !== "number") {
    return undefined;
  }

  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return a / b;
    case "%":
      return a % b;
    case "|":
      // eslint-disable-next-line no-bitwise
      return a | b;
    case "&":
      // eslint-disable-next-line no-bitwise
      return a & b;
    case "^":
      // eslint-disable-next-line no-bitwise
      return a ^ b;
    case "<<":
      // eslint-disable-next-line no-bitwise
      return a << b;
    case ">>":
      // eslint-disable-next-line no-bitwise
      return a >> b;
    case ">>>":
      // eslint-disable-next-line no-bitwise
      return a >>> b;
    default:
      throw new TypeError(`Unexpected operator: ${operator}`);
  }
};

export const calculateUnary = (operator: string, v: any) => {
  if (typeof v !== "number") {
    return undefined;
  }

  switch (operator) {
    case "+":
      return +v;
    case "-":
      return -v;
    case "~":
      // eslint-disable-next-line no-bitwise
      return ~v;
    default:
      throw new TypeError(`Unexpected operator: ${operator}`);
  }
};

export const concat = (a: any, b: any) =>
  typeof a === "string" && typeof b === "string" ? a + b : undefined;

export const sort = (
  collection: {
    [x: string]: any;
  }[],
  getRid: (a: any) => any,
  ...orders: [(a: any) => any, boolean][]
) => {
  const sorted = collection.slice().sort((a, b) => {
    for (let i = 0, l = orders.length; i < l; i += 1) {
      const [getValue, desc] = orders[i];
      const aValue = getValue(a);
      const bValue = getValue(b);
      const r = comparator(aValue, bValue);
      if (r !== 0) return desc ? -r : r;
    }

    // sort by `_rid`
    const rid1 = getRid(a);
    const rid2 = getRid(b);
    return comparator(rid1, rid2);
  });

  if (!orders.length) return sorted;

  // find the index of the first invalid item (undefined, object or array)
  let idx;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const doc = sorted[i];

    for (let j = 0, l = orders.length; j < l; j += 1) {
      const [getValue] = orders[j];
      const value = getValue(doc);
      const t = typeOf(value);
      if (TYPE_ORDERS.has(t)) {
        idx = i !== sorted.length - 1 ? i + 1 : -1;
        break;
      }
    }

    if (idx != null) break;
  }

  return idx != null && idx >= 0 ? sorted.slice(0, idx) : sorted;
};

export const paginate = (
  collection: { [x: string]: any }[],
  maxItemCount?: number,
  continuation?: { token: string },
  getRid?: (a: any) => any,
  orderBy?: [(a: any) => any, boolean]
) => {
  let result = collection;
  let token: continuationToken.Token;
  let offset = 0;

  if (continuation) {
    token = continuationToken.decode(continuation.token);

    let src = 0;
    let i = result.findIndex(d => {
      if (typeof token.RTD !== "undefined" && orderBy) {
        const rtd = orderBy[0](d);
        const r = comparator(rtd, token.RTD) * (orderBy[1] ? -1 : 1);
        if (r < 0) return false;
        if (r > 0) return true;
      }

      const rid = getRid(d);
      if (!rid) {
        throw new Error(
          "The _rid field is required on items for the continuation option."
        );
      }
      if (comparator(rid, token.RID) < 0) return false;
      if (!token.SRC || rid !== token.RID) return true;
      if (src === token.SRC) return true;
      src += 1;
      return false;
    });

    i = i >= 0 ? i : result.length;
    result = result.slice(i);
    offset += i;
  }

  let nextContinuation: {
    token: string;
    range: { min: string; max: string };
  } | null = null;
  if (maxItemCount > 0) {
    if (result.length > maxItemCount) {
      const item = result[maxItemCount];
      const RID = getRid(item);
      if (!RID) {
        throw new Error(
          "The _rid field is required on items for the maxItemCount option."
        );
      }
      const RT = (token ? token.RT : 0) + 1;
      const TRC = (token ? token.TRC : 0) + maxItemCount;
      const RTD = orderBy ? orderBy[0](item) : undefined;

      // calculate "SRC" which is the offset of items with the same `_rid`;
      let j = offset + maxItemCount - 1;
      for (; j >= 0; j -= 1) {
        if (getRid(collection[j]) !== RID) break;
      }
      const SRC = offset + maxItemCount - j - 1;

      const nextToken = continuationToken.encode({ RID, RT, SRC, TRC, RTD });

      nextContinuation = {
        token: nextToken,
        range: { min: "", max: "FF" }
      };
    }

    result = result.slice(0, maxItemCount);
  }

  return {
    result,
    continuation: nextContinuation
  };
};
