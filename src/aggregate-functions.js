// @flow

exports.AVG = (a: number[]) => exports.SUM(a) / a.length;

exports.COUNT = (a: any[]) => a.filter(v => typeof v !== "undefined").length;

exports.MAX = (a: any[]) => Math.max(...a);

exports.MIN = (a: any[]) => Math.min(...a);

exports.SUM = (a: number[]) => a.reduce((s, n) => s + n, 0);
