import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
// A fresh process is essential: demoEnabled is evaluated at module load.
if (process.env.SOKY_DISABLED_CHILD !== "1") {
  execFileSync(
    process.execPath,
    [
      "--import",
      "./tests/demo-loader.mjs",
      import.meta.filename,
      ...process.argv.slice(2),
    ],
    {
      env: {
        ...process.env,
        SOKY_DISABLED_CHILD: "1",
        SOKY_DEMO_MODE: "off",
        SOKY_DEMO_DATA_FOLDER: `qa-disabled-${process.pid}-${Date.now()}`,
      },
      stdio: "inherit",
      windowsHide: true,
    },
  );
} else {
  const { appendDemoIntent, readDemoState } =
    await import("../src/mock/demo-repository.ts");
  let called = false;
  const before = await readDemoState();
  if (process.argv.includes("--reproduce")) {
    const result = await appendDemoIntent((state) => {
      called = true;
      state.revision++;
      return { id: "transient" };
    });
    assert(called);
    assert.equal(result.id, "transient");
    assert.deepEqual(
      { ...(await readDemoState()), updatedAt: null },
      { ...before, updatedAt: null },
    );
    console.log(
      "REPRODUCED F-03: callback returns success but mutation disappears",
    );
  } else {
    await assert.rejects(
      async () =>
        appendDemoIntent(() => {
          called = true;
        }),
      (error) => error.status === 403 && error.code === "DEMO_DISABLED",
    );
    assert.equal(called, false);
    const { handleDemoRequest } = await import("../src/mock/demo-api.ts");
    const call = (route, body, origin = "http://localhost") =>
      handleDemoRequest(
        new Request(`http://localhost/api/mock/v1/${route}`, {
          method: "POST",
          headers: { Origin: origin, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        route,
      );
    const items = [{ productId: "prod-kiyomi", quantity: 1 }];
    const quoteResponse = await call("cart/quote", {
      items,
      fulfillmentType: "PICKUP",
    });
    assert.equal(quoteResponse.status, 200);
    const quote = await quoteResponse.json();
    for (const route of [
      "order-intents",
      "order-intents/any/whatsapp-clicked",
    ]) {
      const response = await call(route, {
        items,
        fulfillmentType: "PICKUP",
        expectedRate: quote.rateSnapshot,
        expectedTotalVes: quote.totals.totalVes,
      });
      assert.equal(response.status, 403);
      const data = await response.json();
      assert.equal(data.code, "DEMO_DISABLED");
      assert.equal(data.id, undefined);
      assert.equal(
        (await call(route, { items }, "https://evil.test")).status,
        403,
      );
    }
    assert.equal((await call("cart/quote", { items: [] })).status, 422);
    assert.deepEqual(
      { ...(await readDemoState()), updatedAt: null },
      { ...before, updatedAt: null },
    );
    console.log(
      "PASS disabled repository/API: callbacks blocked, query/quote preserved, no state mutation",
    );
  }
  await assert.rejects(
    access(path.resolve(".soky-demo", process.env.SOKY_DEMO_DATA_FOLDER)),
    { code: "ENOENT" },
  );
}
