import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOKY_PLAYWRIGHT_MODULE ?? 'C:/Users/cesar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = 'http://127.0.0.1:3102';
const output = 'qa/admin-demo/functional-fixes'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const context = await browser.newContext(); const page = await context.newPage();
const errors = [], requests = [], popups = [];
page.on('pageerror', error => errors.push(error.message));
page.on('popup', popup => popups.push(popup));
context.on('request', request => requests.push(request.url()));
await context.route(/^https?:\/\/(?:wa\.me|api\.whatsapp\.com)/, route => { throw new Error(`Unexpected external navigation ${route.request().url()}`); });
try {
  const products = await (await context.request.get(`${base}/api/mock/v1/products?limit=100`)).json();
  const product = products.data.find(product => product.isAvailable && Number(product.priceAmount) >= 1);
  await page.addInitScript(product => localStorage.setItem('soky.cart.v1', JSON.stringify({ state: { items: [{ productId: product.id, quantity: 2, slug: product.slug, titleSnapshot: product.title, unitPriceCurrencySnapshot: product.priceCurrency, unitPriceCentsSnapshot: Math.round(Number(product.priceAmount) * 100) }] }, version: 0 })), product);
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/cart`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Enviar pedido por WhatsApp', exact: true }).click({ trial: true }); await page.getByLabel(/Tu nombre/).fill('QA datos conservados');
    await page.getByLabel(/Notas generales/).fill('No enviar mensajes externos');
    const button = page.getByRole('button', { name: 'Enviar pedido por WhatsApp', exact: true });
    await button.waitFor();
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/order-intents') && response.status() === 403), button.click(),
    ]);
    await page.getByRole('alert').filter({ hasText: /La demo está desactivada/ }).waitFor();
    assert.equal(await page.getByLabel(/Tu nombre/).inputValue(), 'QA datos conservados');
    assert.equal(await page.getByLabel(/Notas generales/).inputValue(), 'No enviar mensajes externos');
    assert.equal(await page.getByText('Tu solicitud está preparada.', { exact: false }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Abrir WhatsApp', exact: true }).count(), 0);
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
    assert(popups.every(popup => popup.isClosed()));
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('soky.cart.v1')));
    assert.equal(cart.state.items[0].quantity, 2);
    await page.screenshot({ path: `${output}/disabled-checkout-${width}.png` });
  }
  assert.equal(popups.length, 2);
  assert.equal(requests.some(url => /wa\.me|whatsapp-clicked/.test(url)), false);
  assert.deepEqual(errors, []);
  await writeFile(`${output}/disabled-checkout-results.json`, JSON.stringify({ passed: 2, popupsClosed: popups.length, errors }, null, 2));
  console.log('PASS disabled checkout desktop/mobile: 403 displayed, cart/form kept, popups closed, no external navigation');
} finally { await browser.close(); }
