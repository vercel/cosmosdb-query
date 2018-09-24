// @flow

exports.AVG = (a: number[]) => {
  if (
    !a.length ||
    a.some(v => typeof v !== "number" && typeof v !== "undefined")
  ) {
    return undefined;
  }
  const aa = a.filter(v => typeof v === "number");
  const sum = exports.SUM(aa);
  return typeof sum !== "undefined" ? sum / aa.length : undefined;
};

exports.COUNT = (a: any[]) => a.filter(v => typeof v !== "undefined").length;

exports.MAX = (a: any[]) => {
  if (!a.length || a.some(v => v && typeof v === "object")) {
    return undefined;
  }

  return a
    .filter(v => typeof v === "number" || typeof v === "string")
    .reduce((max, v) => {
      if (typeof max === "undefined") return v;
      return max > v ? max : v;
    }, undefined);
};

exports.MIN = (a: any[]) => {
  if (!a.length || a.some(v => typeof v !== "number")) {
    return undefined;
  }
  return Math.min(...a);
};

exports.SUM = (a: number[]) =>
  a.reduce((s, n) => {
    if (typeof n === "undefined") return s;
    return typeof n === "number" ? s + n : undefined;
  }, 0);
