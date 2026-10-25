import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
process.env.SOKY_DEMO_MODE = 'on';
process.env.SOKY_DEMO_DATA_FOLDER = `qa-s5-${process.pid}-${Date.now()}`;
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
const load = Module._load;
Module._load = function(request, parent, main) {
  if (request === 'server-only') return {};
  if (request === 'next/cache') return { revalidateTag() {} };
  return load.call(this, request, parent, main);
};
loadModule.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
}).outputText, filename);

const { handleDemoRequest } = loadModule('../src/mock/demo-api.ts');
const { newSession, SESSION_COOKIE } = loadModule('../src/mock/demo-auth.ts');
const { readDemoState, mutateDemo, resetDemo } = loadModule('../src/mock/demo-repository.ts');
const { createDemoSeed } = loadModule('../src/mock/demo-seed.ts');
const { sortDemoIntents } = loadModule('../src/mock/demo-reporting.ts');
const { getPublicProducts } = loadModule('../src/mock/helpers.ts');
const cookie = `${SESSION_COOKIE}=${newSession()}`;
const directory = path.join(root, '.soky-demo', process.env.SOKY_DEMO_DATA_FOLDER);
const stateFile = path.join(directory, 'state.json');
const results = [];
async function call(resource, body, { method = body === undefined ? 'GET' : 'POST', status = 200, auth = true } = {}) {
  const request = new Request(`http://localhost/api/mock/v1/${resource}`, {
    method,
    headers: { ...(auth ? { Cookie: cookie } : {}), Origin: 'http://localhost', 'Content-Type': 'application/json', ...(method === 'DELETE' ? { 'If-Match': String((await snapshot()).revision) } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await handleDemoRequest(request, resource.split('?')[0]);
  const data = await response.json();
  assert.equal(response.status, status, `${method} ${resource}: ${JSON.stringify(data)}`);
  return data;
}
const snapshot = () => readDemoState();
const dashboard = () => call('admin/dashboard/summary');
const change = async mutation => mutateDemo((await snapshot()).revision, mutation);
const restore = async () => resetDemo((await snapshot()).revision);
async function test(name, run) {
  try { await run(); results.push({ name, result: 'PASS' }); console.log('PASS', name); }
  catch (error) { results.push({ name, result: 'FAIL', error: error.message }); throw error; }
}

try {
  await test('administrative reporting requires a session and intents remain read-only', async () => {
    for (const route of ['admin/dashboard/summary', 'admin/analytics/summary', 'admin/analytics/products', 'admin/analytics/sliders', 'admin/order-intents']) {
      await call(route, undefined, { auth: false, status: 401 });
    }
    await call('admin/order-intents', {}, { status: 403 });
    await call('admin/order-intents/missing', undefined, { status: 404 });
  });
  await test('global counters include availability changes beyond the first 20 products', async () => {
    const state = await snapshot();
    assert.ok(state.products.length > 20);
    const before = await dashboard();
    assert.equal(before.total, state.products.length);
    assert.equal(before.published, getPublicProducts(state).length);
    const first = await call('admin/products?limit=20');
    const outside = getPublicProducts(state).find(product => product.isAvailable && !first.data.some(row => row.id === product.id));
    assert.ok(outside);
    await call(`admin/products/${outside.id}`, { expectedRevision: state.revision, isAvailable: false }, { method: 'PATCH' });
    const after = await dashboard();
    assert.equal(after.unavailable, before.unavailable + 1);
    assert.equal(after.total, before.total);
    assert.equal(after.published, before.published);
    const added = await call('admin/products', { expectedRevision: (await snapshot()).revision, title: 'Producto S5', slug: 'producto-s5', description: 'Ejemplo S5', categoryId: outside.categoryId, status: 'ACTIVE', isAvailable: false, priceAmount: '3.00', priceCurrency: 'EUR', imageUrl: outside.imageUrl, imageAlt: 'Ejemplo S5', sortOrder: 999999 }, { status: 201 });
    assert.ok(added.data.id);
    const enlarged = await dashboard();
    assert.equal(enlarged.total, after.total + 1);
    assert.equal(enlarged.published, after.published + 1);
    assert.equal(enlarged.unavailable, after.unavailable + 1);
  });
  await test('list filters and pagination do not change the global dashboard', async () => {
    const before = await dashboard();
    const bytes = fs.readFileSync(stateFile, 'utf8');
    for (const query of ['?search=no-such-product', '?status=DRAFT&isAvailable=false', '?page=3&limit=1', '?categoryId=missing']) await call(`admin/products${query}`);
    assert.deepEqual(await dashboard(), before);
    assert.deepEqual(await call('admin/dashboard/summary?status=DRAFT&limit=1'), before);
    assert.equal(fs.readFileSync(stateFile, 'utf8'), bytes);
  });
  await test('unavailable drafts are excluded; inactive categories match catalog and quote eligibility', async () => {
    await restore();
    const state = await snapshot();
    const product = getPublicProducts(state).find(row => row.isAvailable);
    const before = await dashboard();
    await call(`admin/products/${product.id}`, { expectedRevision: state.revision, status: 'DRAFT', isAvailable: false }, { method: 'PATCH' });
    const after = await dashboard();
    assert.equal(after.published, before.published - 1);
    assert.equal(after.unavailable, before.unavailable);
    await restore();
    const active = await snapshot();
    await call('admin/exchange-rates/manual', { expectedRevision: active.revision, baseCurrency: 'EUR', rate: '1000', fetchedAt: new Date().toISOString() });
    await call(`admin/categories/${product.categoryId}`, { expectedRevision: (await snapshot()).revision, isActive: false, confirmDeactivate: true }, { method: 'PATCH' });
    const disabled = await snapshot();
    const summary = await dashboard();
    assert.equal(summary.published, getPublicProducts(disabled).length);
    assert.equal(summary.unavailable, getPublicProducts(disabled).filter(row => !row.isAvailable).length);
    const catalog = await call('products?limit=100', undefined, { auth: false });
    assert.equal(catalog.meta.total, summary.published);
    assert.ok(catalog.data.every(row => row.categoryId !== product.categoryId));
    const quote = await call('cart/quote', { items: [{ productId: product.id, quantity: 1 }], fulfillmentType: 'PICKUP' }, { auth: false });
    assert.deepEqual(quote.invalidItems, [{ productId: product.id, reason: 'INACTIVE' }]);
  });
  await test('fixed examples reconcile totals, define ratios, and ignore session visits', async () => {
    await restore();
    const summary = await call('admin/analytics/summary');
    const products = await call('admin/analytics/products');
    const sliders = await call('admin/analytics/sliders');
    assert.equal(summary.source, 'FIXED_DEMO_FIXTURES');
    assert.equal(summary.productViews, products.reduce((sum, row) => sum + row.views, 0));
    assert.equal(summary.addToCart, products.reduce((sum, row) => sum + row.addToCart, 0));
    assert.equal(summary.promotionViews, sliders.reduce((sum, row) => sum + row.views, 0));
    assert.equal(summary.conversionRate, `${(summary.whatsappClicked / summary.checkoutStarted * 100).toFixed(1)}%`);
    const before = fs.readFileSync(stateFile, 'utf8');
    await call('analytics/events', { sessionId: 'qa-s5', eventType: 'product_view', entityType: 'product', entityId: products[0].productId }, { status: 202, auth: false });
    assert.equal(fs.readFileSync(stateFile, 'utf8'), before);
    assert.deepEqual(await call('admin/analytics/summary'), summary);
  });
  await test('historical examples survive deletion and rankings have stable ID tie-breaks', async () => {
    const state = await snapshot();
    const source = state.analytics.products.find(row => !state.sliders.some(slide => slide.productId === row.productId || slide.rotatorImages?.some(image => image.productId === row.productId)));
    assert.ok(source);
    const original = await call('admin/analytics/summary');
    await call(`admin/products/${source.productId}`, undefined, { method: 'DELETE' });
    const historical = (await call('admin/analytics/products')).find(row => row.productId === source.productId);
    assert.equal(historical.historical, true);
    assert.equal(historical.title, source.title);
    assert.deepEqual(await call('admin/analytics/summary'), original);
    await change(draft => {
      draft.analytics.products = ['historical-z', 'historical-a'].map(productId => ({ ...source, productId, title: 'Mismo título' }));
      const row = draft.analytics.sliders[0];
      draft.analytics.sliders = ['historical-z', 'historical-a'].map(sliderId => ({ ...row, sliderId, title: 'Mismo título' }));
    });
    for (let count = 0; count < 2; count++) {
      assert.deepEqual((await call('admin/analytics/products')).map(row => row.productId), ['historical-a', 'historical-z']);
      const promotions = await call('admin/analytics/sliders');
      assert.deepEqual(promotions.map(row => row.sliderId), ['historical-a', 'historical-z']);
      assert.ok(promotions.every(row => row.historical));
    }
  });
  await test('zero denominators and stale percentage strings produce finite zero ratios', async () => {
    await change(draft => {
      draft.analytics.summary = { productViews: 0, addToCart: 0, checkoutStarted: 0, whatsappClicked: 0, conversionRate: 'NaN%' };
      draft.analytics.products.forEach(row => Object.assign(row, { views: 0, addToCart: 0, conversionRate: 'Infinity%' }));
      draft.analytics.sliders.forEach(row => Object.assign(row, { views: 0, clicks: 0, clickRate: 'NaN%' }));
    });
    const summary = await call('admin/analytics/summary');
    assert.equal(summary.conversionRate, '0.0%');
    for (const row of await call('admin/analytics/products')) assert.equal(row.conversionRate, '0.0%');
    for (const row of await call('admin/analytics/sliders')) assert.equal(row.clickRate, '0.0%');
    assert.ok(!/NaN|Infinity/.test(JSON.stringify(summary)));
  });
  let originalIntent;
  await test('intent keeps creation amounts and rate after product, rate and EUR/USD changes', async () => {
    await restore();
    const state = await snapshot();
    const product = getPublicProducts(state).find(row => row.isAvailable);
    await call('admin/exchange-rates/manual', { expectedRevision: state.revision, baseCurrency: 'EUR', rate: '1000', fetchedAt: new Date().toISOString() });
    const items = [{ productId: product.id, quantity: 2 }];
    const quote = await call('cart/quote', { items, fulfillmentType: 'PICKUP' }, { auth: false });
    const created = await call('order-intents', { items, fulfillmentType: 'PICKUP', customerName: 'Ejemplo S5', expectedRate: quote.rateSnapshot, expectedTotalVes: quote.totals.totalVes }, { status: 201, auth: false });
    assert.equal(created.demoPreview, true);
    assert.equal(created.whatsappUrl, '');
    assert.equal(created.confirmationUrl, '');
    originalIntent = await call(`admin/order-intents/${created.id}`);
    assert.deepEqual(originalIntent.items, quote.items);
    assert.deepEqual(originalIntent.totals, quote.totals);
    assert.deepEqual(originalIntent.rateSnapshot, quote.rateSnapshot);
    await call(`admin/products/${product.id}`, { expectedRevision: (await snapshot()).revision, priceAmount: '19.50' }, { method: 'PATCH' });
    await call('admin/exchange-rates/manual', { expectedRevision: (await snapshot()).revision, baseCurrency: 'EUR', rate: '1100', fetchedAt: new Date().toISOString() });
    assert.deepEqual(await call(`admin/order-intents/${created.id}`), originalIntent);
    const current = await snapshot();
    await call('admin/currency-change', { expectedRevision: current.revision, currency: 'USD', confirmed: true, prices: Object.fromEntries(current.products.map(row => [row.id, row.priceAmount])), minimumOrderAmount: '1.00', serviceFeeAmount: '0.00', rate: '1200', fetchedAt: new Date().toISOString() });
    assert.deepEqual(await call(`admin/order-intents/${created.id}`), originalIntent);
    const usdQuote = await call('cart/quote', { items, fulfillmentType: 'PICKUP' }, { auth: false });
    assert.equal(usdQuote.rateSnapshot.baseCurrency, 'USD');
    assert.equal(usdQuote.items[0].unitPriceAmount, '19.50');
    assert.equal(usdQuote.totals.subtotalUsd, '39.00');
    assert.equal(usdQuote.totals.totalVes, '46800.00');
  });
  await test('preview creates an intent without any false WhatsApp exit', async () => {
    const before = await dashboard();
    assert.equal(before.intents, 1);
    assert.equal(before.whatsappClicked, 0);
    const bytes = fs.readFileSync(stateFile, 'utf8');
    await call(`order-intents/${originalIntent.id}/whatsapp-clicked`, {}, { auth: false, status: 403 });
    assert.equal(fs.readFileSync(stateFile, 'utf8'), bytes);
    assert.equal((await dashboard()).whatsappClicked, 0);
    // A separately recorded historical exit is distinct from creating an intent.
    await change(draft => { draft.orderIntents[0].whatsappClickedAt = new Date().toISOString(); });
    assert.equal((await dashboard()).whatsappClicked, 1);
    assert.equal((await dashboard()).intents, 1);
  });
  await test('intent pagination is complete, stable by date/ID, clamped and read-only', async () => {
    await change(draft => {
      draft.orderIntents = Array.from({ length: 23 }, (_, index) => ({
        ...structuredClone(originalIntent), id: `s5-${String(index).padStart(2, '0')}`, publicCode: `S5-${index}`,
        createdAt: index === 22 ? undefined : `2026-10-24T${String(Math.floor(index / 2)).padStart(2, '0')}:00:00.000Z`,
      })).reverse();
    });
    const state = await snapshot();
    const expected = sortDemoIntents(state.orderIntents).map(row => row.id);
    assert.equal(expected[0], 's5-20');
    assert.equal(expected[1], 's5-21');
    assert.equal(expected.at(-1), 's5-22');
    const before = fs.readFileSync(stateFile, 'utf8');
    const first = await call('admin/order-intents?page=1&limit=20');
    const second = await call('admin/order-intents?page=2&limit=20');
    assert.equal(first.meta.total, 23);
    assert.deepEqual([...first.data, ...second.data].map(row => row.id), expected);
    assert.deepEqual(await call('admin/order-intents?page=999&limit=20'), second);
    assert.equal((await call('admin/order-intents?page=NaN&limit=20')).meta.page, 1);
    await call(`admin/order-intents/${expected[0]}`, {}, { method: 'PATCH', status: 403 });
    assert.equal(fs.readFileSync(stateFile, 'utf8'), before);
  });
  await test('empty catalog, analytics and intents have useful zero results', async () => {
    await change(draft => {
      draft.products = [];
      draft.categories = [];
      draft.sliders = [];
      draft.orderIntents = [];
      draft.analytics = { summary: { productViews: 0, addToCart: 0, checkoutStarted: 0, whatsappClicked: 0, conversionRate: '0.0%' }, products: [], sliders: [] };
    });
    const summary = await dashboard();
    for (const key of ['total', 'published', 'unavailable', 'intents', 'whatsappClicked']) assert.equal(summary[key], 0);
    const intents = await call('admin/order-intents?page=5');
    assert.deepEqual(intents.data, []);
    assert.equal(intents.meta.page, 1);
    assert.equal(intents.meta.pageCount, 1);
    assert.deepEqual(await call('admin/analytics/products'), []);
    assert.deepEqual(await call('admin/analytics/sliders'), []);
    assert.equal((await call('admin/analytics/summary')).conversionRate, '0.0%');
  });
  await test('reset restores fixtures, intents, dashboard and pending manual rate coherently', async () => {
    const previousRevision = (await snapshot()).revision;
    await call('admin/demo/reset', { expectedRevision: previousRevision, confirm: 'RESTORE' });
    const restored = await snapshot();
    const seed = JSON.parse(JSON.stringify(createDemoSeed()));
    for (const key of ['products', 'categories', 'sliders', 'analytics', 'orderIntents', 'currentRate', 'rateHistory', 'settings']) assert.deepEqual(restored[key], seed[key]);
    assert.ok(restored.revision > previousRevision);
    const summary = await dashboard();
    assert.equal(summary.total, seed.products.length);
    assert.equal(summary.intents, 0);
    assert.equal(summary.whatsappClicked, 0);
    assert.equal(summary.rate.pendingValidation, true);
    assert.equal(summary.rate.stale, true);
    assert.equal((await call('admin/analytics/summary')).productViews, seed.analytics.products.reduce((sum, row) => sum + row.views, 0));
  });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  const output = process.env.S5_RESULTS_PATH ?? path.join(root, 'qa/admin-demo/s5/domain-results.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({ total: results.length, passed: results.filter(row => row.result === 'PASS').length, cases: results }, null, 2));
  const expectedParent = path.resolve(root, '.soky-demo') + path.sep;
  assert.ok(directory.startsWith(expectedParent) && path.basename(directory).startsWith('qa-s5-'));
  fs.rmSync(directory, { recursive: true, force: true });
}
