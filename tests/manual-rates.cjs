// Run from client/: node tests/manual-rates.cjs. Isolated files, no live demo reset.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS is required for the isolated require.extensions TypeScript harness. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
process.chdir(root);
if (!process.argv.includes("--snapshot"))
  process.env.SOKY_DEMO_DATA_FOLDER = `qa-s3-${process.pid}-${Date.now()}`;
process.env.SOKY_DEMO_MODE = "on";
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(
    this,
    request.startsWith("@/")
      ? path.join(root, "src", request.slice(2))
      : request,
    parent,
    ...rest,
  );
};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "next/cache") return { revalidateTag() {} };
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
      fileName: filename,
    }).outputText,
    filename,
  );

const { convertMoneyCents } = require("../src/lib/money.ts");
const {
  normalizeManualRate,
  caracasInputDate,
  caracasReferenceUtc,
  validRateReference,
} = require("../src/features/exchange-rates/manual-rate.ts");
const {
  isUsableExchangeRate,
} = require("../src/features/exchange-rates/rate-validation.ts");
const { createDemoSeed } = require("../src/mock/demo-seed.ts");
const { currentRate, validateRate } = require("../src/mock/demo-validation.ts");
const { buildCartQuote } = require("../src/mock/helpers.ts");
const { handleDemoRequest } = require("../src/mock/demo-api.ts");
const {
  getEstimatedCartTotals,
} = require("../src/features/cart/cartTotals.ts");
const { readDemoState, mutateDemo } = require("../src/mock/demo-repository.ts");
let checks = 0;
function test(name, run) {
  run();
  checks++;
  console.log(`PASS ${name}`);
}

async function main() {
  test("required money examples and line rounding", () => {
    assert.equal(convertMoneyCents(2400, "1000"), 2400000);
    assert.equal(convertMoneyCents(1250, "991.16"), 1238950);
    assert.equal(convertMoneyCents(1, "1.5"), 2);
    assert.equal(convertMoneyCents(2, "1.5"), 3);
    assert.equal(convertMoneyCents(Number.MAX_SAFE_INTEGER, "2"), null);
  });
  test("comma normalized; invalid inputs rejected without truncation", () => {
    assert.equal(normalizeManualRate("991,16"), "991.16");
    for (const value of [
      "",
      "0",
      "-1",
      "1e3",
      "1.000,50",
      "1.2.3",
      "1.1234567",
      "NaN",
      "Infinity",
    ])
      assert.equal(normalizeManualRate(value), null, value);
  });
  test("Caracas reference roundtrip and invalid/future dates", () => {
    assert.equal(caracasInputDate("2026-10-22T12:00:00Z"), "2026-10-22T08:00");
    assert.equal(
      caracasReferenceUtc("2026-10-22T08:00"),
      "2026-10-22T12:00:00.000Z",
    );
    assert.equal(caracasReferenceUtc("2026-02-31T08:00"), null);
    assert.equal(validRateReference("2026-02-31T08:00:00Z"), false);
    assert.equal(
      validRateReference(new Date(Date.now() + 360000).toISOString()),
      false,
    );
  });
  const seed = createDemoSeed();
  const reference = new Date().toISOString();
  const validBody = {
    baseCurrency: "EUR",
    targetCurrency: "VES",
    rate: "991,16",
    fetchedAt: reference,
    mode: "MANUAL",
    source: "MANUAL",
  };
  test("seed stays pending; 25h blocks checkout; wrong base rejected", () => {
    assert.equal(currentRate(seed).stale, true);
    const rate = validateRate(validBody, seed);
    assert.equal(rate.rate, "991.16");
    assert.equal(isUsableExchangeRate(rate, "EUR"), true);
    assert.equal(isUsableExchangeRate(rate, "USD"), false);
    assert.equal(
      isUsableExchangeRate(
        {
          ...rate,
          fetchedAt: new Date(Date.now() - 25 * 3600000).toISOString(),
        },
        "EUR",
      ),
      false,
    );
    assert.throws(() =>
      validateRate({ ...validBody, baseCurrency: "USD" }, seed),
    );
    assert.throws(() =>
      validateRate({ ...validBody, source: "DOLAR_API" }, seed),
    );
    assert.throws(() =>
      validateRate({ ...validBody, rate: "99999999999999999999" }, seed),
    );
    assert.equal(
      seed.currentRate.fetchedAt,
      createDemoSeed().currentRate.fetchedAt,
    );
  });
  test("drawer and quote agree on quantity before conversion", () => {
    const state = structuredClone(seed);
    const product = state.products.find(
      (p) =>
        p.status === "ACTIVE" &&
        p.isAvailable &&
        state.categories.some((c) => c.id === p.categoryId && c.isActive),
    );
    product.priceAmount = "0.01";
    state.currentRate = {
      ...validateRate({ ...validBody, rate: "1.5" }, state),
    };
    const quote = buildCartQuote(
      { items: [{ productId: product.id, quantity: 2 }] },
      "default",
      state,
    );
    assert.equal(quote.totals.totalVes, "0.03");
    const drawer = getEstimatedCartTotals(
      [
        {
          productId: product.id,
          quantity: 2,
          unitPriceCentsSnapshot: 1,
          unitPriceCurrencySnapshot: "EUR",
        },
      ],
      state.currentRate,
    );
    assert.equal(drawer.totalVes, quote.totals.totalVes);
    const overflow = getEstimatedCartTotals(
      [
        {
          quantity: 2,
          unitPriceCentsSnapshot: Number.MAX_SAFE_INTEGER,
          unitPriceCurrencySnapshot: "EUR",
        },
      ],
      state.currentRate,
    );
    assert.equal(overflow.totalVes, undefined);
  });

  const origin = "http://localhost:3199";
  let cookie;
  async function call(resource, body, authenticated = true) {
    const response = await handleDemoRequest(
      new Request(`${origin}/api/mock/v1/${resource}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          origin,
          "content-type": "application/json",
          ...(authenticated && cookie ? { cookie } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      resource,
    );
    return { response, data: await response.json() };
  }
  const login = await call("auth/login", {
    email: "admin@soky.test",
    password: "demo",
  });
  assert.equal(login.response.status, 200);
  cookie = login.response.headers.get("set-cookie").split(";")[0];
  let state = await readDemoState();
  const initialRevision = state.revision;
  for (const value of ["0", "-1", "1e3", "1.000,50", "1.1234567"]) {
    const result = await call("admin/exchange-rates/manual", {
      ...validBody,
      rate: value,
      expectedRevision: state.revision,
    });
    assert.equal(result.response.status, 422);
  }
  assert.equal((await readDemoState()).revision, initialRevision);
  checks++;
  console.log("PASS invalid writes preserve revision");
  const unauthenticated = await call(
    "admin/exchange-rates/manual",
    { ...validBody, expectedRevision: state.revision },
    false,
  );
  assert.equal(unauthenticated.response.status, 401);
  let saved = await call("admin/exchange-rates/manual", {
    ...validBody,
    expectedRevision: state.revision,
  });
  assert.equal(saved.response.status, 200, JSON.stringify(saved.data));
  state = await readDemoState();
  const savedReference = state.currentRate.fetchedAt;
  assert.equal(state.rateHistory.length, 1);
  assert.equal(state.currentRate.id, state.rateHistory[0].id);
  assert.equal(state.currentRate.rate, "991.16");
  assert.ok(state.rateHistory[0].recordedAt);
  const restarted = require("node:child_process").spawnSync(
    process.execPath,
    [__filename, "--snapshot"],
    { encoding: "utf8", env: process.env },
  );
  assert.equal(restarted.status, 0, restarted.stderr);
  assert.deepEqual(JSON.parse(restarted.stdout).currentRate, state.currentRate);
  assert.deepEqual(JSON.parse(restarted.stdout).rateHistory, state.rateHistory);
  assert.equal(
    (await call("exchange-rates/current")).data.fetchedAt,
    savedReference,
  );
  saved = await call("admin/exchange-rates/manual", {
    ...validBody,
    fetchedAt: new Date(Date.now() - 1000).toISOString(),
    expectedRevision: state.revision,
  });
  assert.equal(saved.response.status, 200);
  state = await readDemoState();
  assert.equal(state.rateHistory.length, 2);
  assert.notEqual(state.rateHistory[0].id, state.rateHistory[1].id);
  checks++;
  console.log(
    "PASS authenticated save, real history, reaffirmation and stable reference",
  );

  const product = state.products.find(
    (p) =>
      p.status === "ACTIVE" &&
      p.isAvailable &&
      state.categories.some((c) => c.id === p.categoryId && c.isActive),
  );
  const cart = {
    items: [{ productId: product.id, quantity: 2 }],
    fulfillmentType: "PICKUP",
  };
  const quote = (await call("cart/quote", cart)).data;
  const requested = {
    ...cart,
    expectedRate: quote.rateSnapshot,
    expectedTotalVes: quote.totals.totalVes,
  };
  const intent = await call("order-intents", requested);
  assert.equal(intent.response.status, 201, JSON.stringify(intent.data));
  assert.ok(intent.data.whatsappMessage.includes(quote.rateSnapshot.rate));
  state = await readDemoState();
  const historical = structuredClone(state.orderIntents);
  await call("admin/exchange-rates/manual", {
    ...validBody,
    rate: "1000",
    expectedRevision: state.revision,
  });
  const obsolete = await call("order-intents", requested);
  assert.equal(obsolete.response.status, 409);
  checks++;
  console.log("PASS obsolete quote blocked before message/intent creation");

  state = await readDemoState();
  const prices = Object.fromEntries(
    state.products.map((p) => [p.id, p.priceAmount]),
  );
  const migration = {
    currency: "USD",
    prices,
    minimumOrderAmount: "1.00",
    serviceFeeAmount: "0.00",
    rate: "1000",
    fetchedAt: reference,
    confirmed: true,
    expectedRevision: state.revision,
  };
  for (const body of [
    { ...migration, prices: {} },
    { ...migration, expectedRevision: state.revision - 1 },
    { ...migration, rate: "1e3" },
    { ...migration, serviceFeeAmount: undefined },
  ]) {
    const result = await call("admin/currency-change", body);
    assert.ok(
      [409, 422].includes(result.response.status),
      JSON.stringify(result.data),
    );
    assert.deepEqual(await readDemoState(), state);
  }
  const switched = await call("admin/currency-change", migration);
  assert.equal(switched.response.status, 200, JSON.stringify(switched.data));
  state = await readDemoState();
  assert.equal(state.settings.defaultCurrency, "USD");
  assert.ok(state.products.every((p) => p.priceCurrency === "USD"));
  assert.equal(state.currentRate.baseCurrency, "USD");
  assert.deepEqual(state.orderIntents, historical);
  checks++;
  console.log(
    "PASS atomic currency migration including drafts/archived and immutable historical intents",
  );
  await mutateDemo(state.revision, (draft) => {
    draft.currentRate.fetchedAt = new Date(
      Date.now() - 25 * 3600000,
    ).toISOString();
  });
  assert.equal((await call("exchange-rates/current")).data.stale, true);
  assert.equal((await call("cart/quote", cart)).response.status, 503);
  checks++;
  console.log("PASS stale rate blocks public quote");
  state = await readDemoState();
  const reset = await call("admin/demo/reset", {
    confirm: "RESTORE",
    expectedRevision: state.revision,
  });
  assert.equal(reset.response.status, 200);
  const restored = await readDemoState();
  assert.equal(restored.currentRate.pendingValidation, true);
  assert.equal(currentRate(restored).stale, true);
  assert.equal(restored.rateHistory.length, 0);
  checks++;
  console.log("PASS reset restores pending fictitious seed");
  console.log(`${checks} S3 groups passed`);
}
if (process.argv.includes("--snapshot"))
  readDemoState()
    .then((state) => console.log(JSON.stringify(state)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
else
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
