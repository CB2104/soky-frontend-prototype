// Real Redis + a private local Next instance. All keys use one random QA namespace.
// No credentials, cookies or storageState are written to the result report.
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import { redisDemoConfig } from '../src/mock/demo-config.ts';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOKY_PLAYWRIGHT_MODULE ?? 'C:/Users/cesar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = 'http://127.0.0.1:3101';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'qa/admin-demo/upstash-live');
const namespace = `qa-real-${randomBytes(12).toString('hex')}`;
process.env.VERCEL_ENV = 'development';
process.env.SOKY_DEMO_NAMESPACE = namespace;
const config = redisDemoConfig();
assert(/^soky:demo:v2:development:qa-real-[a-f0-9]{24}$/.test(config.prefix));
if (process.env.SOKY_QA_EXPECTED_REDIS_ORIGIN) assert(new URL(config.url).origin === process.env.SOKY_QA_EXPECTED_REDIS_ORIGIN, 'La base configurada no coincide con la integración Vercel identificada.');
const redis = new Redis({ url: config.url, token: config.token, automaticDeserialization: false, retry: { retries: 0 } });
await mkdir(output, { recursive: true });
const logOut = openSync(path.join(output, 'server.stdout.log'), 'a');
const logErr = openSync(path.join(output, 'server.stderr.log'), 'a');
const results = [], errors = [];
let server, browser, a, b, cleaned = 0, failed = false;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(3101, '127.0.0.1', resolve); });
  await new Promise(resolve => probe.close(resolve));
}
async function start() {
  await freePort();
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3101'], {
    cwd: root, windowsHide: true, stdio: ['ignore', logOut, logErr],
    env: { ...process.env, SOKY_DEMO_MODE: 'on', SOKY_DEMO_STORAGE: 'redis', SOKY_NEXT_DIST_DIR: '.next', NEXT_PUBLIC_API_MODE: 'mock', NEXT_PUBLIC_SITE_URL: base },
  });
  for (let attempt = 0; attempt < 45; attempt++) {
    if (server.exitCode !== null) throw new Error('La instancia QA terminó antes de iniciar.');
    try { if ((await fetch(`${base}/api/mock/v1/products`)).ok) return; } catch { /* Wait only for this test's own server. */ }
    await sleep(400);
  }
  throw new Error('La instancia QA no inició dentro del plazo.');
}
async function stop() {
  if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
}
async function api(context, route, { method = 'GET', body, status = 200 } = {}) {
  const response = await context.request.fetch(`${base}/api/mock/v1/${route}`, { method, headers: { Origin: base }, ...(body === undefined ? {} : { data: body }) });
  const data = await response.json();
  assert.equal(response.status(), status, `${route}: ${data.code ?? 'unexpected response'}`);
  return data;
}
async function login(context) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/admin-secret/products`, { waitUntil: 'networkidle' });
  await page.waitForURL('**/admin-secret/login**');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('admin@soky.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('demo');
  await page.getByRole('button', { name: 'Entrar a la demo', exact: true }).click();
  await page.waitForURL('**/admin-secret/products');
  return page;
}
async function test(name, run) {
  await run(); results.push({ name, result: 'PASS' }); console.log(`PASS ${name}`);
}
async function sessionKeys(context) {
  const token = (await context.cookies()).find(row => row.name === 'soky_demo_session')?.value;
  assert(token && /^[a-f0-9]{64}$/.test(token));
  const sessionKey = `${config.prefix}:session:${createHash('sha256').update(token).digest('hex')}`;
  const raw = await redis.get(sessionKey);
  assert.equal(typeof raw, 'string', 'La sesión no está en el namespace de QA previsto.');
  const record = JSON.parse(raw);
  assert(/^[a-f0-9]{32}$/.test(record.datasetId));
  return { sessionKey, dataKey: `${config.prefix}:data:${record.datasetId}` };
}

try {
  await start();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  a = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  b = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  let pageA, pageB, initial, product, intent, saved, bBeforeReset;
  const title = 'Producto QA Redis visitante A';
  await test('Two independent browser contexts log in; runtime status confirms real Redis', async () => {
    pageA = await login(a); pageB = await login(b);
    assert.equal((await api(a, 'admin/demo/status')).persistence, 'redis-per-visitor');
    assert.equal((await api(b, 'admin/demo/status')).persistence, 'redis-per-visitor');
    const ka = await sessionKeys(a), kb = await sessionKeys(b);
    assert.notEqual(ka.dataKey, kb.dataKey);
    initial = await api(a, 'admin/demo/workspace');
    product = initial.products.find(row => row.id === 'prod-kiyomi');
    assert(product?.isAvailable);
  });
  await test('A product edit and manual rate reach only the same visitor', async () => {
    await api(a, `admin/products/${product.id}`, { method: 'PATCH', body: { expectedRevision: initial.revision, title, priceAmount: '13.50' } });
    const current = await api(a, 'admin/demo/workspace');
    await api(a, 'admin/exchange-rates/manual', { method: 'POST', body: { expectedRevision: current.revision, baseCurrency: 'EUR', rate: '1000.000000', fetchedAt: new Date().toISOString() } });
    const changed = await api(a, `products/${product.slug}`);
    const other = await api(b, `products/${product.slug}`);
    assert.equal(changed.title, title); assert.equal(changed.priceAmount, '13.50');
    assert.equal(other.title, product.title); assert.equal(other.priceAmount, product.priceAmount);
    assert.equal((await api(b, 'admin/demo/workspace')).rateHistory.length, initial.rateHistory.length);
  });
  await test('SSR detail/menu and the cart keep the Redis session and edited price', async () => {
    await pageA.goto(`${base}/menu/${product.slug}`, { waitUntil: 'networkidle' });
    await pageA.getByRole('heading', { name: title, exact: true }).waitFor();
    await pageB.goto(`${base}/menu/${product.slug}`, { waitUntil: 'networkidle' });
    await pageB.getByRole('heading', { name: product.title, exact: true }).waitFor();
    assert.equal(await pageB.getByText(title, { exact: true }).count(), 0);
    await pageA.getByRole('button', { name: 'Añadir al carrito', exact: true }).click();
    await pageA.goto(`${base}/cart`, { waitUntil: 'networkidle' });
    await pageA.waitForURL('**/cart');
    await pageA.getByText(title, { exact: true }).first().waitFor();
    const cart = await pageA.evaluate(() => JSON.parse(localStorage.getItem('soky.cart.v1')));
    const item = cart.state.items.find(row => row.productId === 'prod-kiyomi');
    assert(item); assert.equal(item.unitPriceCentsSnapshot, 1350);
    await pageA.screenshot({ path: path.join(output, 'visitor-a-cart.png') });
    await pageB.goto(`${base}/menu`, { waitUntil: 'networkidle' });
    assert.equal(await pageB.getByText(title, { exact: true }).count(), 0);
  });
  await test('Real Redis quote and intent keep the snapshot and remain WhatsApp previews', async () => {
    const items = [{ productId: product.id, quantity: 2 }];
    const quote = await api(a, 'cart/quote', { method: 'POST', body: { items, fulfillmentType: 'PICKUP' } });
    assert.equal(quote.items[0].unitPriceAmount, '13.50');
    assert.equal(quote.items[0].lineTotalAmount, '27.00');
    assert.equal(quote.items[0].lineTotalVes, '27000.00');
    intent = await api(a, 'order-intents', { method: 'POST', status: 201, body: { items, fulfillmentType: 'PICKUP', expectedRate: quote.rateSnapshot, expectedTotalVes: quote.totals.totalVes } });
    assert.equal(intent.whatsappUrl, ''); assert.equal(intent.demoPreview, true);
    const detail = await api(a, `admin/order-intents/${intent.id}`);
    assert.deepEqual(detail.rateSnapshot, quote.rateSnapshot);
    assert.equal(detail.customerName, 'Cliente demo');
    await api(b, `admin/order-intents/${intent.id}`, { status: 404 });
  });
  await test('Two overlapping writes from one visitor return one success and one real 409', async () => {
    const current = await api(a, 'admin/demo/workspace');
    const requests = ['QA A', 'QA B'].map(businessName => a.request.patch(`${base}/api/mock/v1/admin/settings`, { headers: { Origin: base }, data: { expectedRevision: current.revision, businessName } }));
    const responses = await Promise.all(requests);
    assert.deepEqual(responses.map(response => response.status()).sort(), [200, 409]);
    saved = await api(a, 'admin/demo/workspace');
    assert.equal(saved.revision, current.revision + 1);
  });
  await test('A fresh local server process retains both Redis sessions and saved data', async () => {
    await stop(); await start();
    await api(a, 'auth/me'); await api(b, 'auth/me');
    const restored = await api(a, 'admin/demo/workspace');
    assert.equal(restored.revision, saved.revision);
    assert.equal(restored.products.find(row => row.id === product.id).title, title);
    assert(restored.orderIntents.some(row => row.id === intent.id));
    await pageA.goto(`${base}/menu/${product.slug}`, { waitUntil: 'networkidle' });
    await pageA.getByRole('heading', { name: title, exact: true }).waitFor();
  });
  await test('Cancel reset keeps edits; confirming restores only the current browser copy', async () => {
    bBeforeReset = await api(b, 'admin/demo/workspace');
    await pageA.goto(`${base}/admin-secret/demo`, { waitUntil: 'networkidle' });
    await pageA.getByRole('button', { name: 'Restaurar demo', exact: true }).click();
    await pageA.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal((await api(a, 'admin/demo/workspace')).revision, saved.revision);
    await pageA.getByRole('button', { name: 'Restaurar demo', exact: true }).click();
    await pageA.getByRole('dialog').getByRole('button', { name: 'Restaurar datos', exact: true }).click();
    await pageA.getByText('Datos restaurados.', { exact: false }).first().waitFor();
    const reset = await api(a, 'admin/demo/workspace');
    assert.equal(reset.products.find(row => row.id === product.id).title, product.title);
    assert.equal(reset.orderIntents.length, initial.orderIntents.length);
    const other = await api(b, 'admin/demo/workspace');
    assert.equal(other.revision, bBeforeReset.revision);
  });
  await test('Data and session expiration return controlled 401 responses without silently recreating data', async () => {
    const keys = await sessionKeys(b);
    await redis.expire(keys.dataKey, 1); await sleep(1400);
    await api(b, 'admin/demo/workspace', { status: 401 });
    assert.equal(await redis.get(keys.dataKey), null);
    await api(b, 'auth/login', { method: 'POST', body: { email: 'admin@soky.test', password: 'demo' } });
    const newKeys = await sessionKeys(b); assert.notEqual(newKeys.dataKey, keys.dataKey);
    await redis.expire(newKeys.sessionKey, 1); await sleep(1400);
    await api(b, 'admin/demo/workspace', { status: 401 });
    await api(b, 'products'); await api(a, 'admin/demo/workspace');
  });
  await test('Logout revokes the real Redis session and JavaScript has no uncaught errors', async () => {
    const keys = await sessionKeys(a);
    await api(a, 'auth/logout', { method: 'POST', body: {} });
    assert.equal(await redis.get(keys.sessionKey), null);
    await api(a, 'admin/demo/workspace', { status: 401 });
    assert.deepEqual(errors, []);
  });
} catch (error) {
  failed = true; process.exitCode = 1;
  const message = String(error?.message ?? 'El recorrido no terminó.').split(config.token).join('[REDACTED]').split(config.url).join('[REDIS_URL]').slice(0, 2000);
  results.push({ name: 'live QA', result: 'FAIL', message });
  console.error(results.at(-1).message);
} finally {
  if (browser) await browser.close();
  await stop();
  closeSync(logOut); closeSync(logErr);
  try {
    let cursor = '0'; const keys = new Set();
    do {
      const [next, rows] = await redis.scan(cursor, { match: `${config.prefix}:*`, count: 100 });
      cursor = String(next);
      for (const key of rows) {
        if (!key.startsWith(`${config.prefix}:`)) throw new Error('Clave fuera del namespace QA.');
        keys.add(key);
      }
    } while (cursor !== '0');
    if (!/^soky:demo:v2:development:qa-real-[a-f0-9]{24}$/.test(config.prefix)) throw new Error('Namespace de limpieza no válido.');
    for (const key of keys) cleaned += Number(await redis.del(key));
  } catch { failed = true; process.exitCode = 1; results.push({ name: 'cleanup', result: 'FAIL', message: 'No se completó la limpieza aislada; las claves mantienen su TTL.' }); }
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors, cleanedTestKeys: cleaned, passed: !failed, realRedisVerified: true, publishedDeploymentVerified: false }, null, 2));
}
if (!failed) console.log(`PASS real Redis application QA: ${results.length} groups; ${cleaned} isolated test keys removed`);
