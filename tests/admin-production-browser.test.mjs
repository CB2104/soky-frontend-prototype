import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const loadModule = createRequire(import.meta.url);
const { chromium } = loadModule(process.env.SOKY_PLAYWRIGHT_MODULE ?? 'C:/Users/cesar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.SOKY_PRODUCTION_QA_URL ?? 'http://127.0.0.1:3101';
assert.equal(new URL(base).port, '3101', 'This test only mutates the dedicated production QA instance.');
const output = path.resolve('qa/admin-demo');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const results = [], errors = [];
const pending = new Set();
let context, page;
async function test(name, run) { await run(); results.push({ name, result: 'PASS' }); console.log('PASS', name); }
async function api(route, method = 'GET', body) {
  const response = await context.request.fetch(`${base}/api/mock/v1/${route}`, { method, headers: { Origin: base }, data: body });
  const data = await response.json();
  assert(response.ok(), `${method} ${route}: ${JSON.stringify(data)}`);
  return data;
}
const snapshot = () => api('admin/demo/workspace');
try {
  context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => pending.add(request.url()));
  page.on('requestfinished', request => pending.delete(request.url()));
  page.on('requestfailed', request => pending.delete(request.url()));
  let popups = 0; page.on('popup', () => popups++);
  await test('production login opens the protected Hero editor', async () => {
    await page.goto(`${base}/admin-secret/sliders`, { waitUntil: 'networkidle' });
    await page.waitForURL('**/admin-secret/login**');
    await page.getByLabel('Correo electrónico', { exact: true }).fill('admin@soky.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('demo');
    await page.getByRole('button', { name: 'Entrar a la demo', exact: true }).click();
    await page.waitForURL('**/admin-secret/sliders');
    await page.getByRole('button', { name: /Boxes y promociones/ }).click();
    await page.getByLabel('Título', { exact: true }).waitFor();
  });
  await test('draft preview does not save; the real Save button persists after reload', async () => {
    const before = await snapshot();
    await page.getByLabel('Título', { exact: true }).fill('Un box para tu demo');
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/admin/sliders/preview') && response.status() === 200),
      page.getByRole('button', { name: 'Ver borrador', exact: true }).click(),
    ]);
    await page.getByText('Vista previa · cambios sin guardar', { exact: true }).waitFor();
    assert.equal((await snapshot()).revision, before.revision);
    assert.equal(popups, 0);
    await page.screenshot({ path: path.join(output, 'production-hero-draft-desktop.png') });
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/admin/sliders/slider-boxes') && response.request().method() === 'PATCH' && response.status() === 200),
      page.getByRole('button', { name: 'Guardar cambios', exact: true }).click(),
    ]);
    assert.equal((await snapshot()).sliders.find(slide => slide.id === 'slider-boxes').title, 'Un box para tu demo');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Boxes y promociones/ }).click();
    assert.equal(await page.getByLabel('Título', { exact: true }).inputValue(), 'Un box para tu demo');
  });
  let intent;
  await test('read-only intent list and detail show the actual historical snapshot', async () => {
    let state = await snapshot();
    await api('admin/exchange-rates/manual', 'POST', { expectedRevision: state.revision, baseCurrency: 'EUR', targetCurrency: 'VES', rate: '1000', fetchedAt: new Date().toISOString(), note: 'QA de producción ficticia' });
    const items = [{ productId: 'prod-kiyomi', quantity: 1 }];
    const quote = await api('cart/quote', 'POST', { items });
    intent = await api('order-intents', 'POST', { items, fulfillmentType: 'PICKUP', customerName: 'Cliente demo QA', expectedRate: quote.rateSnapshot, expectedTotalVes: quote.totals.totalVes });
    assert.equal(intent.demoPreview, true);
    await page.goto(`${base}/admin-secret/order-intents`, { waitUntil: 'networkidle' });
    await page.getByRole('cell', { name: intent.publicCode, exact: true }).waitFor();
    await page.getByRole('link', { name: 'Ver detalle', exact: true }).click();
    await page.getByText('Snapshot de tasa', { exact: true }).waitFor();
    assert.match(await page.locator('#detalle').innerText(), /EUR/);
    assert.equal(await page.getByRole('button', { name: /Confirmar venta/ }).count(), 0);
    await page.screenshot({ path: path.join(output, 'production-intent-detail.png') });
  });
  await test('global USD migration reaches the public Hero without a euro symbol', async () => {
    const state = await snapshot();
    await api('admin/currency-change', 'POST', { expectedRevision: state.revision, currency: 'USD', prices: Object.fromEntries(state.products.map(product => [product.id, product.priceAmount])), minimumOrderAmount: '1.00', serviceFeeAmount: '0.00', rate: '2', fetchedAt: new Date().toISOString(), confirmed: true });
    await page.goto(base, { waitUntil: 'networkidle', timeout: 120000 });
    const controls = page.locator('[aria-label="Slides del hero"] button');
    await controls.nth(1).click();
    await page.getByText('$', { exact: true }).first().waitFor({ state: 'visible' });
    assert.equal(await page.getByText('€', { exact: true }).count(), 0);
    await page.screenshot({ path: path.join(output, 'production-home-usd-1366.png') });
    assert.equal((await api(`admin/order-intents/${intent.id}`)).rateSnapshot.baseCurrency, 'EUR');
  });
  await test('mobile Hero and admin remain within the document width', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: 'networkidle', timeout: 120000 });
    await page.locator('[aria-label="Slides del hero"] button').nth(1).click();
    await page.getByText('$', { exact: true }).first().waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(output, 'production-home-usd-390.png') });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.goto(`${base}/admin-secret/sliders`, { waitUntil: 'networkidle' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: path.join(output, 'production-hero-editor-390.png') });
  });
  await test('production browser has no uncaught JavaScript errors in this normal-motion route', async () => {
    assert.deepEqual(errors, []);
    assert.equal(popups, 0);
  });
} finally {
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(output, 'production-last-state.png') }).catch(() => {});
  if (context) {
    try { const state = await snapshot(); await api('admin/demo/reset', 'POST', { expectedRevision: state.revision, confirm: 'RESTORE' }); } catch { /* Record the original failure; never reset another instance. */ }
  }
  await writeFile(path.join(output, 'production-browser-results.json'), JSON.stringify({ date: new Date().toISOString(), base, results, errors, pendingRequests: [...pending] }, null, 2));
  await browser.close();
}
console.log(`${results.length} production browser groups passed`);
