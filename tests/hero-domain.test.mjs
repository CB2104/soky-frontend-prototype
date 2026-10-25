// Isolated domain tests. HTTP mounting is covered by api-integration.mjs.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import ts from "typescript";
const loadModule = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
process.env.SOKY_DEMO_MODE = "on";
process.env.SOKY_DEMO_DATA_FOLDER = `qa-s4-${process.pid}-${Date.now()}`;
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
const load = Module._load;
Module._load = function (request, parent, main) {
  if (request === "server-only") return {};
  if (request === "next/cache") return { revalidateTag() {} };
  return load.call(this, request, parent, main);
};
loadModule.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
const { handleDemoRequest } = loadModule("../src/mock/demo-api.ts");
const { newSession, SESSION_COOKIE } = loadModule("../src/mock/demo-auth.ts");
const { readDemoState, mutateDemo } = loadModule(
  "../src/mock/demo-repository.ts",
);
const { HERO_ROLES } = loadModule("../src/features/hero/admin-fields.ts");
const { mapPublicSliderToHeroSlide } = loadModule(
  "../src/features/hero/mappers.ts",
);
const { resolveProductSlide } = loadModule(
  "../src/features/hero/resolve-product-slides.ts",
);
const { mockSliderItems } = loadModule("../src/mock/db.ts");
const cookie = `${SESSION_COOKIE}=${newSession()}`;
const results = [];
const stateFile = path.join(
  root,
  ".soky-demo",
  process.env.SOKY_DEMO_DATA_FOLDER,
  "state.json",
);
async function call(resource, patch, status = 200, revision) {
  const state = await readDemoState();
  const request = new Request(`http://localhost/api/mock/v1/${resource}`, {
    method: patch === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: "http://localhost",
      "Content-Type": "application/json",
    },
    body:
      patch === undefined
        ? undefined
        : JSON.stringify({
            expectedRevision: revision ?? state.revision,
            ...patch,
          }),
  });
  const actual =
    resource.startsWith("admin/sliders/") &&
    resource !== "admin/sliders/preview" &&
    patch !== undefined
      ? new Request(request, { method: "PATCH" })
      : request;
  const response = await handleDemoRequest(actual, resource);
  const data = await response.json();
  assert.equal(response.status, status, `${resource}: ${JSON.stringify(data)}`);
  return data;
}
async function test(name, run) {
  await run();
  results.push({ name, result: "PASS" });
  console.log("PASS", name);
}
async function main() {
  await test("four roles retain identity/order and original composition", async () => {
    const initial = await readDemoState();
    const listed = (await call("admin/sliders")).data;
    const slides = listed.slice(0, HERO_ROLES.length);
    assert.deepEqual(
      slides.map((slide) => slide.id),
      HERO_ROLES.map((role) => role.id),
    );
    assert.deepEqual(
      new Set(listed.map((slide) => slide.id)),
      new Set(initial.sliders.map((slide) => slide.id)),
    );
    assert(listed.some((slide) => slide.placement === "menu_banner"));
    for (const slide of slides) {
      await call(
        `admin/sliders/${slide.id}`,
        slide.id === "slider-kiyomi"
          ? { primaryCta: { type: "MENU", label: "Explorar sabores" } }
          : { title: `Texto ${slide.id}` },
      );
      const changed = (await readDemoState()).sliders.find(
        (row) => row.id === slide.id,
      );
      for (const field of [
        "intent",
        "layoutHint",
        "background",
        "colorLayer",
        "patternOverlay",
        "sortOrder",
        "headlineParts",
      ])
        assert.deepEqual(changed[field], slide[field]);
    }
    assert.equal(
      initial.sliders.filter(
        (slide) => slide.placement === "home_hero" && slide.status === "ACTIVE",
      ).length,
      4,
    );
  });
  await test("other placements remain read-only and cannot become a fifth editable role", async () => {
    const before = fs.readFileSync(stateFile, "utf8");
    await call(
      "admin/sliders/slider-menu-banner",
      { title: "No editar aquí" },
      403,
    );
    await call(
      "admin/sliders/preview",
      { slideId: "slider-menu-banner", patch: {} },
      422,
    );
    assert.equal(fs.readFileSync(stateFile, "utf8"), before);
  });
  await test("connected fields survive storage and the existing public mapper for each role", async () => {
    for (const role of HERO_ROLES) {
      const patch = { primaryCta: { type: "MENU", label: `Ver ${role.role}` } };
      if (role.fields.includes("description"))
        patch.description = `Descripción ${role.role}`;
      if (role.fields.includes("eyebrow")) patch.eyebrow = `Texto ${role.role}`;
      await call(`admin/sliders/${role.id}`, patch);
      const publicSlide = (await call("sliders/active")).find(
        (slide) => slide.id === role.id,
      );
      const mapped = mapPublicSliderToHeroSlide(publicSlide, 0);
      assert.equal(mapped.primaryCta.label, patch.primaryCta.label);
      if (patch.description)
        assert.equal(mapped.description, patch.description);
      if (patch.eyebrow) assert.equal(mapped.eyebrow, patch.eyebrow);
      assert.equal(
        (await readDemoState()).sliders.find((slide) => slide.id === role.id)
          .primaryCta.label,
        patch.primaryCta.label,
      );
    }
  });
  await test("preview validates every role without publishing or changing file bytes", async () => {
    for (const role of HERO_ROLES) {
      const before = fs.readFileSync(stateFile, "utf8");
      const patch =
        role.id === "slider-kiyomi"
          ? { secondaryCta: { type: "LOCATION", label: "Ver ubicación" } }
          : { title: "Borrador de prueba" };
      const preview = await call("admin/sliders/preview", {
        slideId: role.id,
        patch,
      });
      assert.equal(preview.preview, true);
      assert.equal(preview.slide.id, role.id);
      assert.equal(fs.readFileSync(stateFile, "utf8"), before);
    }
  });
  await test("protected layout, headline, price and unsupported fields reject without writing", async () => {
    const before = fs.readFileSync(stateFile, "utf8");
    for (const patch of [
      { title: "No cambiar" },
      { sortOrder: 999 },
      { background: { mode: "none" } },
      { productName: "Duplicado" },
      { layoutHint: "poster" },
    ])
      await call("admin/sliders/slider-kiyomi", patch, 422);
    await call(
      "admin/sliders/slider-boxes",
      { badgeLabel: "No se renderiza" },
      422,
    );
    await call(
      "admin/sliders/slider-chat",
      { promoNote: "No se renderiza" },
      422,
    );
    assert.equal(fs.readFileSync(stateFile, "utf8"), before);
  });
  await test("image profiles and alt are validated; visual attributes stay locked", async () => {
    const state = await readDemoState();
    const welcome = state.sliders.find((slide) => slide.id === "slider-kiyomi");
    const missing = structuredClone(welcome.rotatorImages);
    delete missing[0].desktop;
    await call("admin/sliders/slider-kiyomi", { rotatorImages: missing }, 422);
    const duplicated = structuredClone(welcome.rotatorImages);
    duplicated[0].priceLabel = "1€";
    await call(
      "admin/sliders/slider-kiyomi",
      { rotatorImages: duplicated },
      422,
    );
    await call(
      "admin/sliders/slider-kiyomi",
      { productLayer: { ...welcome.productLayer, fit: "contain" } },
      422,
    );
    await call("admin/sliders/slider-kiyomi", {
      productLayer: {
        ...welcome.productLayer,
        alt: "Nueva descripción de la composición",
      },
    });
  });
  await test("canonical name, price, currency and pieces follow catalog after editing", async () => {
    let state = await readDemoState();
    const product = state.products.find(
      (product) => product.slug === "box-kiyomi",
    );
    await call("admin/sliders/slider-weekly-special", {
      productId: product.id,
    });
    await mutateDemo((await readDemoState()).revision, (draft) => {
      const p = draft.products.find((p) => p.id === product.id);
      p.title = "Nombre canónico";
      p.priceAmount = "27.30";
      p.details.pieces = 80;
    });
    const slides = await call("sliders/active");
    const best = slides.find((slide) => slide.id === "slider-weekly-special");
    const image = slides
      .find((slide) => slide.id === "slider-boxes")
      .rotatorImages.find((image) => image.productId === product.id);
    assert.equal(best.productName, "Nombre canónico");
    assert.equal(best.highlightText, "80");
    assert.equal(image.name, "Nombre canónico");
    assert.equal(image.priceAmount, "27.30");
    assert.equal(image.priceCurrency, "EUR");
    state = await readDemoState();
    assert.equal(
      state.sliders.find((slide) => slide.id === "slider-boxes")
        .rotatorImages[0].priceLabel,
      undefined,
    );
    await mutateDemo(state.revision, (draft) => {
      draft.settings.defaultCurrency = "USD";
      draft.currentRate.baseCurrency = "USD";
      draft.products.forEach((product) => {
        product.priceCurrency = "USD";
      });
    });
    const usdBox = (await call("sliders/active")).find(
      (slide) => slide.id === "slider-boxes",
    );
    const view = mapPublicSliderToHeroSlide(usdBox, 1);
    assert.equal(view.rotatorImages[0].priceCurrency, "USD");
    assert.equal(view.rotatorImages[0].priceAmount, "27.30");
    const legacy = mockSliderItems.find((slide) => slide.id === "slider-boxes");
    const current = await readDemoState();
    const projected = resolveProductSlide(
      legacy,
      current.products,
      current.categories,
    );
    assert.equal(projected.rotatorImages[0].name, legacy.rotatorImages[0].name);
    assert.equal(projected.rotatorImages[0].priceCurrency, "USD");
    assert.equal(legacy.rotatorImages[0].priceAmount, undefined);
  });
  await test("unavailable/category-inactive references fall back safely; cannot publish", async () => {
    let state = await readDemoState();
    const best = state.sliders.find(
      (slide) => slide.id === "slider-weekly-special",
    );
    const product = state.products.find(
      (product) => product.id === best.productId,
    );
    await mutateDemo(state.revision, (draft) => {
      draft.categories.find(
        (category) => category.id === product.categoryId,
      ).isActive = false;
    });
    const slides = await call("sliders/active");
    const publicBest = slides.find((slide) => slide.id === best.id);
    assert.equal(publicBest.productName, undefined);
    assert.equal(publicBest.primaryCta.type, "MENU");
    await call(`admin/sliders/${best.id}`, { status: "ACTIVE" }, 422);
    const preview = await call("admin/sliders/preview", {
      slideId: best.id,
      patch: { title: "Aún es borrador", primaryCta: best.primaryCta },
    });
    assert.equal(preview.preview, true);
    await mutateDemo((await readDemoState()).revision, (draft) => {
      draft.categories.find(
        (category) => category.id === product.categoryId,
      ).isActive = true;
    });
  });
  await test("deactivation, reactivation and stale revisions are real state transitions", async () => {
    let state = await readDemoState();
    const revision = state.revision;
    await call("admin/sliders/slider-chat", { status: "INACTIVE" });
    assert.equal((await call("sliders/active")).length, 3);
    await call(
      "admin/sliders/slider-chat",
      { title: "Edición antigua" },
      409,
      revision,
    );
    await call("admin/sliders/slider-chat", { status: "ACTIVE" });
    assert.equal((await call("sliders/active")).length, 4);
  });
  await test("unsafe CTA protocols and foreign paths never persist", async () => {
    for (const target of ["javascript:alert(1)", "//evil.test", "/\\evil.test"])
      await call(
        "admin/sliders/slider-chat",
        {
          primaryCta: {
            label: "Destino inválido",
            type: "CUSTOM_PATH",
            target,
          },
        },
        422,
      );
    await call("admin/sliders/slider-chat", {
      primaryCta: { label: "Ver menú", type: "MENU" },
    });
    assert.equal(
      (await readDemoState()).sliders.find(
        (slide) => slide.id === "slider-chat",
      ).primaryCta.type,
      "MENU",
    );
  });
}
main()
  .then(() => console.log(`${results.length} S4 groups passed`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.writeFileSync(
      path.join(root, "qa/admin-demo/hero-domain-results.json"),
      JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
    );
    const target = path.resolve(
      root,
      ".soky-demo",
      process.env.SOKY_DEMO_DATA_FOLDER,
    );
    assert(
      target.startsWith(path.resolve(root, ".soky-demo") + path.sep) &&
        path.basename(target).startsWith("qa-s4-"),
    );
    fs.rmSync(target, { recursive: true, force: true });
  });
