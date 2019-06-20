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

const TYPE_ORDERS = new Set(["boolean", "null", "string", "number"]);

const prop = (
  obj: {
    [x: string]: any;
  },
  keys: string[]
) => keys.reduce((o, k) => (typeof o !== "undefined" ? o[k] : o), obj);

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
  ...orders: [string[], boolean][]
) => {
  if (
    !orders.length ||
    orders.some(([o]) => !Array.isArray(o) || o.length < 2)
  ) {
    throw new Error(
      "Unsupported ORDER BY clause. ORDER BY item expression could not be mapped to a document path."
    );
  }

  const sorted = collection.slice().sort((a, b) => {
    for (let i = 0, l = orders.length; i < l; i += 1) {
      const [keys, desc] = orders[i];
      const aValue = prop(a, keys);
      const bValue = prop(b, keys);
      const aType = typeOf(aValue);
      const bType = typeOf(bValue);

      let r = 0;
      if (aType === bType) {
        if (TYPE_ORDERS.has(aType)) {
          if (aType === "string") {
            if (aValue < bValue) {
              r = -1;
            } else if (aValue > bValue) {
              r = 1;
            }
          } else {
            r = aValue - bValue;
          }
        }
      } else {
        [...TYPE_ORDERS].some(t => {
          if (aType === t) {
            r = -1;
            return true;
          }
          if (bType === t) {
            r = 1;
            return true;
          }
          return false;
        });
      }
      if (r !== 0) return desc ? -r : r;
    }
    return 0;
  });

  // find the index of the first invalid item (undefined, object or array)
  let idx;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const doc = sorted[i];

    for (let j = 0, l = orders.length; j < l; j += 1) {
      const [keys] = orders[j];
      const value = prop(doc, keys);
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
