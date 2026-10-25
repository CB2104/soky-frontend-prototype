import assert from "node:assert/strict";
import { mock } from "node:test";
import { writeFile } from "node:fs/promises";

let responses = [];
const requests = [];
mock.module("../src/lib/api/client.ts", {
  namedExports: {
    apiClient: {
      get: async (path) => {
        requests.push(path);
        assert(responses.length, "Unexpected catalog request");
        return responses.shift();
      },
    },
  },
});
const { getAllProducts } = await import("../src/features/products/api.ts");
const page = (revision, ids, pageCount = 2) => ({
  data: ids.map((id) => ({ id })),
  meta: { revision, pageCount },
});
const results = [];
async function test(name, run) {
  requests.length = 0;
  await run();
  assert.equal(responses.length, 0);
  results.push({ name, result: "PASS" });
  console.log("PASS", name);
}

try {
  await test("complete ordered catalog from matching revisions", async () => {
    responses = [page(10, ["a"], 3), page(10, ["b"]), page(10, ["c"])];
    assert.deepEqual(
      (await getAllProducts()).map((product) => product.id),
      ["a", "b", "c"],
    );
    assert.equal(requests.length, 3);
  });
  await test("catalog transaction between pages retries the whole list", async () => {
    responses = [
      page(10, ["old-eur"]),
      page(11, ["new-usd"]),
      page(11, ["usd-a"]),
      page(11, ["usd-b"]),
    ];
    assert.deepEqual(
      (await getAllProducts()).map((product) => product.id),
      ["usd-a", "usd-b"],
    );
    assert.equal(requests.length, 4);
  });
  await test("continuous changes produce a recoverable error without a mixed catalog", async () => {
    responses = [
      page(1, ["a"]),
      page(2, ["b"]),
      page(2, ["c"]),
      page(3, ["d"]),
      page(3, ["e"]),
      page(4, ["f"]),
    ];
    await assert.rejects(getAllProducts(), /catálogo está cambiando/);
    assert.equal(requests.length, 6);
  });
  await test("existing real API without revision metadata stays compatible", async () => {
    responses = [page(undefined, ["a"]), page(undefined, ["b"])];
    assert.deepEqual(
      (await getAllProducts()).map((product) => product.id),
      ["a", "b"],
    );
  });
  await test("empty catalog does not request nonexistent pages", async () => {
    responses = [page(20, [], 1)];
    assert.deepEqual(await getAllProducts(), []);
    assert.equal(requests.length, 1);
  });
} finally {
  await writeFile(
    new URL(
      "../qa/admin-demo/catalog-pagination-results.json",
      import.meta.url,
    ),
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
  );
}
console.log(`${results.length} pagination groups passed`);
