import assert from "node:assert/strict";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const base = "http://127.0.0.1:3102";
const files = [
  "src/mock/db.ts",
  "src/mock/menu-source.json",
  "src/mock/menu-dto-adapter.ts",
];
const hashes = () =>
  Promise.all(
    files.map(async (file) =>
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex"),
    ),
  );
const before = await hashes();
async function request(route, body, status = 200, origin = base) {
  const response = await fetch(`${base}/api/mock/v1/${route}`, {
    method: body ? "POST" : "GET",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify(data));
  return { data, revision: response.headers.get("x-demo-revision") };
}
const products = await request("products?limit=100");
const product = products.data.data.find((product) => product.isAvailable);
const items = [{ productId: product.id, quantity: 1 }];
const quote = (
  await request("cart/quote", { items, fulfillmentType: "PICKUP" })
).data;
for (const route of [
  "order-intents",
  "order-intents/missing/whatsapp-clicked",
]) {
  const result = await request(
    route,
    {
      items,
      fulfillmentType: "PICKUP",
      expectedRate: quote.rateSnapshot,
      expectedTotalVes: quote.totals.totalVes,
    },
    403,
  );
  assert.equal(result.data.code, "DEMO_DISABLED");
  for (const field of ["id", "success", "whatsappClickedAt", "whatsappUrl"])
    assert.equal(result.data[field], undefined);
  assert.equal(
    (await request(route, { items }, 403, "https://evil.test")).data.code,
    "FORBIDDEN",
  );
}
await request("cart/quote", { items: [] }, 422);
const after = await request("products?limit=100");
assert.deepEqual(after, products);
assert.deepEqual(await hashes(), before);
await assert.rejects(access(".soky-demo/qa-functional-off-20261024"), {
  code: "ENOENT",
});
await mkdir("qa/admin-demo/functional-fixes", { recursive: true });
await writeFile(
  "qa/admin-demo/functional-fixes/http-results.json",
  JSON.stringify(
    {
      passed: true,
      status: 403,
      code: "DEMO_DISABLED",
      datasetCreated: false,
      seedsUnchanged: true,
    },
    null,
    2,
  ),
);
console.log(
  "PASS direct HTTP off: create/tracking 403, origin/validation retained, catalog/quote immutable, no dataset",
);
