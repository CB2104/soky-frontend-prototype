import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const base = process.env.SOKY_QA_URL ?? "http://127.0.0.1:3100";
assert.notEqual(
  new URL(base).port,
  "3000",
  "Never reset the presentation instance.",
);
assert.equal(
  process.env.SOKY_QA_ALLOW_RESET,
  "1",
  "Explicit test dataset reset opt-in required.",
);
let cookie = "",
  revision;
const cases = [];
const seedFiles = [
  "src/mock/db.ts",
  "src/mock/menu-source.json",
  "src/mock/menu-dto-adapter.ts",
];
const seedHashes = await Promise.all(
  seedFiles.map(async (file) =>
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
  ),
);
async function req(
  route,
  {
    method = "GET",
    body,
    status = 200,
    auth = true,
    origin = base,
    expected = revision,
  } = {},
) {
  const headers = {
    ...(origin ? { Origin: origin } : {}),
    ...(auth && cookie ? { Cookie: cookie } : {}),
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method === "DELETE") headers["If-Match"] = String(expected);
  const response = await fetch(`${base}/api/mock/v1/${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const data = await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${route}: ${JSON.stringify(data)}`,
  );
  if (response.headers.has("x-demo-revision"))
    revision = Number(response.headers.get("x-demo-revision"));
  return { data, response };
}
async function test(name, run) {
  const startedAt = Date.now();
  try {
    await run();
    cases.push({ name, result: "PASS", durationMs: Date.now() - startedAt });
    console.log("PASS", name);
  } catch (error) {
    cases.push({ name, result: "FAIL", error: error.message });
    throw error;
  }
}
const snapshot = async () => (await req("admin/demo/workspace")).data;
const mutate = async (route, body, status = 200, method = "PATCH") =>
  (
    await req(route, {
      method,
      body: { ...body, expectedRevision: revision },
      status,
    })
  ).data;
const rate = async (
  value = "1000",
  date = new Date().toISOString(),
  baseCurrency = "EUR",
) =>
  mutate(
    "admin/exchange-rates/manual",
    {
      rate: value,
      fetchedAt: date,
      baseCurrency,
      targetCurrency: "VES",
      note: "Prueba automática ficticia",
    },
    200,
    "POST",
  );
let createdCategory, createdProduct, intentSnapshot, seed;
try {
  await test("QA-01 session and administrative boundary", async () => {
    await req("admin/products", { auth: false, status: 401 });
    await req("auth/login", {
      method: "POST",
      body: { email: "admin@soky.test", password: "wrong" },
      status: 401,
    });
    await req("auth/login", {
      method: "POST",
      body: { email: "admin@soky.test", password: "demo" },
      origin: "https://other.test",
      status: 403,
    });
    const login = await req("auth/login", {
      method: "POST",
      body: { email: "admin@soky.test", password: "demo" },
    });
    cookie = login.response.headers.get("set-cookie").split(";")[0];
    assert.match(login.response.headers.get("set-cookie"), /HttpOnly/i);
    await req("auth/me");
    seed = await snapshot();
    await mutate("admin/demo/reset", { confirm: "RESTORE" }, 200, "POST");
    seed = await snapshot();
    assert.equal(seed.currentRate.pendingValidation, true);
    await req("cart/quote", {
      method: "POST",
      body: { items: [{ productId: seed.products[0].id, quantity: 1 }] },
      status: 503,
    });
  });
  await test("QA-03 complete pagination and stable filters", async () => {
    assert(seed.products.length > 20);
    const first = (await req("admin/products?limit=20&page=1")).data;
    const second = (await req("admin/products?limit=20&page=2")).data;
    assert.equal(first.meta.total, seed.products.length);
    assert.equal(first.data.length, 20);
    assert(second.data.length);
    assert(!first.data.some((a) => second.data.some((b) => a.id === b.id)));
    const filtered = (
      await req(
        `admin/products?search=${encodeURIComponent(seed.products[30].slug)}&sort=title`,
      )
    ).data;
    assert(filtered.data.some((row) => row.id === seed.products[30].id));
    const invalidPage = (await req("admin/products?page=NaN&limit=-1")).data;
    assert.equal(invalidPage.meta.page, 1);
    assert.equal(invalidPage.meta.limit, 1);
  });
  await test("QA-02 category/product create, public detail and full data preservation", async () => {
    createdCategory = (
      await mutate(
        "admin/categories",
        {
          name: "Pruebas demo",
          key: "qa-demo",
          slug: "qa-demo",
          group: "FOOD",
          description: "Datos ficticios",
          sortOrder: 999999,
          isActive: true,
        },
        201,
        "POST",
      )
    ).data;
    createdProduct = (
      await mutate(
        "admin/products",
        {
          title: "Producto de prueba",
          slug: "qa-producto",
          description: "Descripción de ejemplo",
          shortDescription: "Ejemplo",
          categoryId: createdCategory.id,
          type: "SIMPLE",
          status: "ACTIVE",
          isAvailable: true,
          featured: false,
          sortOrder: 999999,
          priceCurrency: "EUR",
          priceAmount: "24.00",
          imageUrl: seed.products[0].imageUrl,
          imageAlt: "Imagen ficticia del producto",
          tags: ["demo"],
          allergens: [],
          details: {
            pieces: 24,
            composition: [{ type: "Tempura", quantity: 24 }],
          },
        },
        201,
        "POST",
      )
    ).data;
    const detail = (await req("products/qa-producto")).data;
    assert.equal(detail.priceAmount, "24.00");
    assert.equal(detail.priceCurrency, "EUR");
    await mutate(`admin/products/${createdProduct.id}`, {
      title: "Producto editado",
    });
    const updated = (await req(`admin/products/${createdProduct.id}`)).data;
    assert.deepEqual(updated.details, createdProduct.details);
    assert.deepEqual(updated.tags, createdProduct.tags);
    const old =
      seed.products.find((product) => product.metadata && product.details) ??
      seed.products.find((product) => product.sourceId);
    await mutate(`admin/products/${old.id}`, { featured: !old.featured });
    const preserved = (await req(`admin/products/${old.id}`)).data;
    for (const field of [
      "metadata",
      "sourceId",
      "details",
      "labels",
      "descriptionSource",
    ])
      assert.deepEqual(preserved[field], old[field]);
  });
  await test("QA-02 invalid values and field errors never mutate", async () => {
    const old = await snapshot();
    for (const value of ["1e3", "-1", "1.001", "Infinity", "NaN", "1.000,50"])
      await mutate(
        `admin/products/${createdProduct.id}`,
        { priceAmount: value },
        422,
      );
    await mutate(
      `admin/products/${createdProduct.id}`,
      { imageUrl: "javascript:alert(1)" },
      422,
    );
    await mutate(
      `admin/products/${createdProduct.id}`,
      { priceCurrency: "USD" },
      422,
    );
    await mutate(
      `admin/products/${createdProduct.id}`,
      { slug: seed.products[0].slug },
      409,
    );
    assert.deepEqual(await snapshot(), old);
  });
  await test("QA-15 conflict and concurrent edits preserve accepted write", async () => {
    const stale = revision;
    const results = await Promise.all(
      ["A", "B"].map((title) =>
        fetch(`${base}/api/mock/v1/admin/products/${createdProduct.id}`, {
          method: "PATCH",
          headers: {
            Origin: base,
            Cookie: cookie,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `Concurrente ${title}`,
            expectedRevision: stale,
          }),
        }),
      ),
    );
    assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
    const next = await snapshot();
    assert.equal(next.revision, stale + 1);
    await req(`admin/products/${createdProduct.id}`, {
      method: "PATCH",
      body: { title: "Obsoleto", expectedRevision: stale },
      status: 409,
    });
  });
  await test("QA-06 manual rate validation and exact line rounding", async () => {
    for (const value of [
      "",
      "0",
      "-1",
      "NaN",
      "Infinity",
      "1e3",
      "1.000,50",
      "1.1234567",
    ])
      await mutate(
        "admin/exchange-rates/manual",
        {
          rate: value,
          fetchedAt: new Date().toISOString(),
          baseCurrency: "EUR",
        },
        422,
        "POST",
      );
    await rate();
    let quote = (
      await req("cart/quote", {
        method: "POST",
        body: { items: [{ productId: createdProduct.id, quantity: 1 }] },
      })
    ).data;
    assert.equal(quote.totals.totalVes, "24000.00");
    await mutate(`admin/products/${createdProduct.id}`, {
      priceAmount: "12.50",
    });
    await rate("991.16");
    quote = (
      await req("cart/quote", {
        method: "POST",
        body: { items: [{ productId: createdProduct.id, quantity: 1 }] },
      })
    ).data;
    assert.equal(quote.totals.totalVes, "12389.50");
    await mutate(`admin/products/${createdProduct.id}`, {
      priceAmount: "0.01",
    });
    await rate("1.5");
    for (const [quantity, total] of [
      [1, "0.02"],
      [2, "0.03"],
    ]) {
      quote = (
        await req("cart/quote", {
          method: "POST",
          body: { items: [{ productId: createdProduct.id, quantity }] },
        })
      ).data;
      assert.equal(quote.totals.totalVes, total);
    }
    const history = (await req("admin/exchange-rates/history")).data;
    assert.equal(history.length, 3);
    assert.equal(history[0].rate, "1.5");
    assert.equal((await snapshot()).currentRate.id, history[0].id);
  });
  await test("QA-08 stale and incompatible rate block quote without losing cart", async () => {
    await rate("1000", new Date(Date.now() - 25 * 3600000).toISOString());
    assert.equal((await req("exchange-rates/current")).data.stale, true);
    await req("cart/quote", {
      method: "POST",
      body: { items: [{ productId: createdProduct.id, quantity: 1 }] },
      status: 503,
    });
    await mutate(
      "admin/exchange-rates/manual",
      {
        rate: "1000",
        fetchedAt: new Date().toISOString(),
        baseCurrency: "USD",
      },
      422,
      "POST",
    );
    await rate("1000");
  });
  await test("QA-04 category eligibility affects menu, detail, hero and quote", async () => {
    await mutate(
      `admin/categories/${createdCategory.id}`,
      { isActive: false },
      422,
    );
    await mutate(`admin/categories/${createdCategory.id}`, {
      isActive: false,
      confirmDeactivate: true,
    });
    await req("products/qa-producto", { status: 404 });
    const quote = (
      await req("cart/quote", {
        method: "POST",
        body: { items: [{ productId: createdProduct.id, quantity: 1 }] },
      })
    ).data;
    assert.equal(quote.invalidItems[0].reason, "INACTIVE");
    await req(`admin/categories/${createdCategory.id}`, {
      method: "DELETE",
      status: 409,
    });
    await mutate(`admin/categories/${createdCategory.id}`, { isActive: true });
    await mutate(`admin/products/${createdProduct.id}`, { isAvailable: false });
    const unavailable = (
      await req("cart/quote", {
        method: "POST",
        body: { items: [{ productId: createdProduct.id, quantity: 1 }] },
      })
    ).data;
    assert.equal(unavailable.invalidItems[0].reason, "UNAVAILABLE");
    await mutate(`admin/products/${createdProduct.id}`, {
      isAvailable: true,
      priceAmount: "24.00",
    });
  });
  await test("QA-11 protected Hero fields, canonical refs and non-publishing preview", async () => {
    const before = await snapshot();
    const preview = (
      await req("admin/sliders/preview", {
        method: "POST",
        body: {
          expectedRevision: revision,
          slideId: "slider-boxes",
          patch: { title: "Borrador sin publicar" },
        },
      })
    ).data;
    assert.equal(preview.slide.title, "Borrador sin publicar");
    assert.equal(preview.preview, true);
    assert.deepEqual(await snapshot(), before);
    await mutate(
      "admin/sliders/slider-kiyomi",
      { title: "Headline protegido" },
      422,
    );
    await mutate("admin/sliders/slider-boxes", { layoutHint: "poster" }, 422);
    await mutate(
      "admin/sliders/slider-boxes",
      {
        primaryCta: {
          label: "Inseguro",
          type: "CUSTOM_PATH",
          target: "//other.test",
        },
      },
      422,
    );
    await mutate("admin/sliders/slider-weekly-special", {
      productId: createdProduct.id,
      title: "PIEZAS",
      primaryCta: {
        label: "Ver producto",
        type: "PRODUCT",
        target: "qa-producto",
      },
    });
    await mutate(`admin/products/${createdProduct.id}`, {
      title: "Canon demo",
      slug: "qa-canon",
    });
    const publicSlides = (await req("sliders/active")).data;
    const best = publicSlides.find(
      (slide) => slide.id === "slider-weekly-special",
    );
    assert.equal(best.productName, "Canon demo");
    assert.equal(best.primaryCta.target, "qa-canon");
    assert.equal(best.highlightText, "24");
    assert.deepEqual(
      publicSlides.map((slide) => slide.id),
      ["slider-kiyomi", "slider-boxes", "slider-weekly-special", "slider-chat"],
    );
    await req(`admin/products/${createdProduct.id}`, {
      method: "DELETE",
      status: 409,
    });
  });
  await test("QA-10 settings persist, forbid free currency patch and enforce minimum", async () => {
    await mutate("admin/settings", {
      businessName: "SOKY DEMO QA",
      openingHoursDisplay: ["Horario ficticio de prueba"],
      minimumOrderAmount: "30.00",
    });
    const settings = (await req("settings/public")).data;
    assert.equal(settings.businessName, "SOKY DEMO QA");
    assert.equal(settings.minimumOrderAmount, "30.00");
    assert.equal(settings.demoPreview, true);
    await mutate(
      "admin/settings",
      { deliveryEnabled: false, pickupEnabled: false },
      422,
    );
    await mutate("admin/settings", { defaultCurrency: "USD" }, 422);
    await mutate("admin/settings", { minimumOrderAmount: "1.00" });
  });
  await test("QA-17 intention preserves snapshot and preview never counts a WhatsApp exit", async () => {
    const items = [{ productId: createdProduct.id, quantity: 1 }];
    const quote = (await req("cart/quote", { method: "POST", body: { items } }))
      .data;
    const payload = {
      items,
      fulfillmentType: "PICKUP",
      customerName: "Cliente ficticio QA",
      expectedRate: quote.rateSnapshot,
      expectedTotalVes: quote.totals.totalVes,
    };
    const intent = (
      await req("order-intents", { method: "POST", body: payload, status: 201 })
    ).data;
    assert.equal(intent.demoPreview, true);
    assert.equal(intent.whatsappUrl, "");
    intentSnapshot = (await req(`admin/order-intents/${intent.id}`)).data;
    assert.equal(intentSnapshot.whatsappClickedAt, undefined);
    assert.equal(intentSnapshot.rateSnapshot.baseCurrency, "EUR");
    await rate("1200");
    await req("order-intents", { method: "POST", body: payload, status: 409 });
    assert.deepEqual(
      (await req(`admin/order-intents/${intent.id}`)).data,
      intentSnapshot,
    );
    assert.equal(
      (await req("admin/dashboard/summary")).data.whatsappClicked,
      0,
    );
  });
  await test("QA-09 currency migration complete, atomic and historical", async () => {
    const before = await snapshot();
    await mutate(
      "admin/currency-change",
      {
        currency: "USD",
        prices: {},
        minimumOrderAmount: "1.00",
        serviceFeeAmount: "0.00",
        rate: "2",
        fetchedAt: new Date().toISOString(),
        confirmed: true,
      },
      422,
      "POST",
    );
    assert.deepEqual(await snapshot(), before);
    await mutate(
      "admin/currency-change",
      {
        currency: "USD",
        prices: Object.fromEntries(
          before.products.map((product) => [product.id, product.priceAmount]),
        ),
        minimumOrderAmount: "1.00",
        serviceFeeAmount: "0.00",
        rate: "2",
        fetchedAt: new Date().toISOString(),
        confirmed: true,
      },
      200,
      "POST",
    );
    const after = await snapshot();
    assert.equal(after.settings.defaultCurrency, "USD");
    assert(after.products.every((product) => product.priceCurrency === "USD"));
    assert.equal(after.currentRate.baseCurrency, "USD");
    assert.deepEqual(
      (await req(`admin/order-intents/${intentSnapshot.id}`)).data,
      intentSnapshot,
    );
    const slides = (await req("sliders/active")).data;
    assert(
      slides
        .find((slide) => slide.id === "slider-boxes")
        .rotatorImages.every((image) => image.priceCurrency === "USD"),
    );
  });
  await test("QA-12 aggregate includes products beyond first page and fixed fixture analytics", async () => {
    let all = await snapshot();
    const product = all.products.filter(
      (product) =>
        product.status === "ACTIVE" &&
        product.isAvailable &&
        all.categories.some(
          (category) => category.id === product.categoryId && category.isActive,
        ),
    )[30];
    const before = (await req("admin/dashboard/summary")).data;
    await mutate(`admin/products/${product.id}`, { isAvailable: false });
    const after = (await req("admin/dashboard/summary")).data;
    assert.equal(after.unavailable, before.unavailable + 1);
    assert.equal(after.total, all.products.length);
    assert.equal((await snapshot()).analyticsSource, "FIXED_DEMO_FIXTURES");
  });
  await test("QA-14 reset restores every area and keeps session", async () => {
    await mutate("admin/demo/reset", { confirm: "RESTORE" }, 200, "POST");
    const after = await snapshot();
    for (const field of [
      "products",
      "categories",
      "sliders",
      "settings",
      "currentRate",
      "rateHistory",
      "analytics",
      "orderIntents",
    ])
      assert.deepEqual(after[field], seed[field], field);
    assert(after.revision > seed.revision);
    await req("auth/me");
    const hashes = await Promise.all(
      seedFiles.map(async (file) =>
        createHash("sha256")
          .update(await readFile(file))
          .digest("hex"),
      ),
    );
    assert.deepEqual(hashes, seedHashes, "Immutable seeds changed during QA.");
  });
} finally {
  await writeFile(
    path.resolve("qa/admin-demo/api-integration-results.json"),
    JSON.stringify({ date: new Date().toISOString(), base, cases }, null, 2),
  );
}
console.log(`${cases.length} integration cases passed.`);
