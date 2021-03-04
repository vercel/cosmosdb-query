import * as assert from "assert";
import query from "../lib";

const collection1 = [
  { _rid: "a" },
  { _rid: "c" },
  { _rid: "b" },
  { _rid: "d" }
];

const collection2 = [
  {
    _rid: "a",
    children: [{ name: "a1" }, { name: "a2" }, { name: "a3" }, { name: "a4" }]
  },
  { _rid: "b", children: [{ name: "b1" }] }
];

const collection3 = [
  { _rid: "a", x: 3 },
  { _rid: "b", x: 2 },
  { _rid: "c", x: 1 },
  { _rid: "d", x: 2 }
];

const collection4 = [
  { _rid: "id1", sortKey1: "a", sortKey2: "a" },
  { _rid: "id2", sortKey1: "a", sortKey2: "b" },
  { _rid: "id3", sortKey1: "b", sortKey2: "a" },
  { _rid: "id4", sortKey1: "b", sortKey2: "b" },
  { _rid: "id5", sortKey1: "b", sortKey2: "c" }
];

export function testMaxItemCount() {
  const { result, continuation } = query(`SELECT * FROM c`).exec(collection1, {
    maxItemCount: 2
  });
  assert.deepStrictEqual(result, [{ _rid: "a" }, { _rid: "b" }]);
  assert.deepStrictEqual(continuation, {
    token: "+RID:c#RT:1#TRC:2",
    range: { min: "", max: "FF" }
  });
}

export function testContinuation() {
  const q = query(`SELECT * FROM c`);

  let { result, continuation } = q.exec(collection1, { maxItemCount: 1 });
  assert.deepStrictEqual(result, [{ _rid: "a" }]);
  assert.equal(continuation.token, "+RID:b#RT:1#TRC:1");

  ({ result, continuation } = q.exec(collection1, {
    maxItemCount: 2,
    continuation
  }));
  assert.deepStrictEqual(result, [{ _rid: "b" }, { _rid: "c" }]);
  assert.equal(continuation.token, "+RID:d#RT:2#TRC:3");

  ({ result, continuation } = q.exec(collection1, { continuation }));
  assert.deepStrictEqual(result, [{ _rid: "d" }]);
  assert.equal(continuation, null);
}

export function testContinuationWithoutNextItem() {
  const q = query(`SELECT * FROM c`);
  const { continuation } = q.exec(collection1, { maxItemCount: 2 });
  const collection = collection1.filter(d => d._rid !== "c");
  const { result } = q.exec(collection, { continuation });
  assert.deepStrictEqual(result, [{ _rid: "d" }]);
}

export function testJoin() {
  const q = query(`SELECT c.name FROM r JOIN c IN r.children`);

  let { result, continuation } = q.exec(collection2, { maxItemCount: 2 });
  assert.deepStrictEqual(result, [{ name: "a1" }, { name: "a2" }]);
  assert.deepStrictEqual(continuation, {
    token: "+RID:a#RT:1#SRC:2#TRC:2",
    range: { min: "", max: "FF" }
  });

  ({ result, continuation } = q.exec(collection2, {
    maxItemCount: 2,
    continuation
  }));
  assert.deepStrictEqual(result, [{ name: "a3" }, { name: "a4" }]);
  assert.deepStrictEqual(continuation, {
    token: "+RID:b#RT:2#TRC:4",
    range: { min: "", max: "FF" }
  });
}

export function testOrderBy() {
  const q = query(`SELECT * FROM c ORDER BY c.x`);

  let { result, continuation } = q.exec(collection3, { maxItemCount: 2 });
  assert.deepStrictEqual(result, [{ _rid: "c", x: 1 }, { _rid: "b", x: 2 }]);
  assert.equal(continuation.token, "+RID:d#RT:1#TRC:2#RTD:WzJd");

  ({ result, continuation } = q.exec(collection3, {
    maxItemCount: 2,
    continuation
  }));
  assert.deepStrictEqual(result, [{ _rid: "d", x: 2 }, { _rid: "a", x: 3 }]);

  assert.equal(continuation, null);
}

export function testOrderByDesc() {
  const q = query(`SELECT * FROM c ORDER BY c.x DESC`);

  let { result, continuation } = q.exec(collection3, { maxItemCount: 2 });
  assert.deepStrictEqual(result, [{ _rid: "a", x: 3 }, { _rid: "b", x: 2 }]);
  assert.equal(continuation.token, "+RID:d#RT:1#TRC:2#RTD:WzJd");

  ({ result, continuation } = q.exec(collection3, {
    maxItemCount: 2,
    continuation
  }));
  assert.deepStrictEqual(result, [{ _rid: "d", x: 2 }, { _rid: "c", x: 1 }]);

  assert.equal(continuation, null);
}

export function testOrderByWithoutNextItem() {
  const q = query(`SELECT * FROM c ORDER BY c.x`);
  let { result, continuation } = q.exec(collection3, { maxItemCount: 2 });
  const collection = collection3.filter(d => d._rid !== "d");
  ({ result, continuation } = q.exec(collection, {
    maxItemCount: 2,
    continuation
  }));
  assert.deepStrictEqual(result, [{ _rid: "a", x: 3 }]);
  assert.equal(continuation, null);
}

export function testMultipleOrderBy() {
  const q = query(`SELECT * FROM c ORDER BY c.sortKey1, c.sortKey2 DESC`);

  let { result, continuation } = q.exec(collection4, { maxItemCount: 2 });
  assert.deepStrictEqual(result, [
    { _rid: "id2", sortKey1: "a", sortKey2: "b" },
    { _rid: "id1", sortKey1: "a", sortKey2: "a" }
  ]);
  assert.equal(continuation.token, "+RID:id5#RT:1#TRC:2#RTD:WyJiIiwiYyJd");

  ({ result, continuation } = q.exec(collection4, {
    maxItemCount: 2,
    continuation
  }));
  assert.deepStrictEqual(result, [
    { _rid: "id5", sortKey1: "b", sortKey2: "c" },
    { _rid: "id4", sortKey1: "b", sortKey2: "b" }
  ]);
  assert.equal(continuation.token, "+RID:id3#RT:2#TRC:4#RTD:WyJiIiwiYSJd");

  ({ result, continuation } = q.exec(collection4, {
    maxItemCount: 2,
    continuation
  }));
  assert.deepStrictEqual(result, [
    { _rid: "id3", sortKey1: "b", sortKey2: "a" }
  ]);
  assert.equal(continuation, null);
}
