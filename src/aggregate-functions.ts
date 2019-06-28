export const SUM = (a: number[]) =>
  a.reduce((s, n) => {
    if (typeof n === "undefined") return s;
    return typeof n === "number" ? s + n : undefined;
  }, 0);

export const AVG = (a: number[]) => {
  if (
    !a.length ||
    a.some(v => typeof v !== "number" && typeof v !== "undefined")
  ) {
    return undefined;
  }
  const aa = a.filter(v => typeof v === "number");
  const sum = SUM(aa);
  return typeof sum !== "undefined" ? sum / aa.length : undefined;
};

export const COUNT = (a: any[]) =>
  a.filter(v => typeof v !== "undefined").length;

export const MAX = (a: any[]) => {
  const r = a.reduce((max, v) => {
    // ignore undefined
    if (typeof max === "undefined") return v;
    if (typeof v === "undefined") return max;

    // always return undefined if one of items is "object"
    if ((max && typeof max === "object") || (v && typeof v === "object"))
      return {};

    if (typeof max === typeof v) return max > v ? max : v;

    // string > number > boolean > null
    if (typeof max === "string") return max;
    if (typeof v === "string") return v;
    if (typeof max === "number") return max;
    if (typeof v === "number") return v;
    return typeof max === "boolean" ? max : v;
  }, undefined);

  return r !== null && typeof r === "object" ? undefined : r;
};

export const MIN = (a: any[]) => {
  const r = a.reduce((min, v) => {
    // ignore undefined
    if (typeof min === "undefined") return v;
    if (typeof v === "undefined") return min;

    // always return undefined if one of items is "object"
    if ((min && typeof min === "object") || (v && typeof v === "object"))
      return {};

    if (typeof min === typeof v) return min < v ? min : v;

    // null < boolean < number < string
    if (min === null) return min;
    if (v === null) return v;
    if (typeof min === "boolean") return min;
    if (typeof v === "boolean") return v;
    return typeof min === "number" ? min : v;
  }, undefined);

  return r !== null && typeof r === "object" ? undefined : r;
};
