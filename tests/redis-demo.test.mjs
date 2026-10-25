import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { LuaRedis, redisTestState as state } from './lua-redis-double.mjs';
process.env.SOKY_DEMO_MODE = 'on';
process.env.SOKY_DEMO_STORAGE = 'redis';
process.env.STORAGE_KV_REST_API_URL = 'https://test.upstash.io';
process.env.STORAGE_KV_REST_API_TOKEN = 'test-credential-never-used-over-network';
process.env.NEXT_PUBLIC_SITE_URL = 'https://another-deployment.invalid';
const cookieContext = new AsyncLocalStorage();
mock.module('@upstash/redis', { namedExports: { Redis: LuaRedis } });
mock.module('next/cache', { namedExports: { revalidateTag() {}, unstable_cache: fn => fn } });
mock.module('next/headers', { namedExports: { cookies: async () => ({ get: () => ({ value: cookieContext.getStore() }) }) } });

const { handleDemoRequest } = await import('../src/mock/demo-api.ts');
const { RedisDemoStore } = await import('../src/mock/demo-redis.ts');
const { redisDemoConfig, demoStorageMode } = await import('../src/mock/demo-config.ts');
const { withDemoSession } = await import('../src/mock/demo-context.ts');
const repo = await import('../src/mock/demo-repository.ts');
const { serverApiGet } = await import('../src/lib/api/server.ts');
const { getAllProducts } = await import('../src/mock/demo-server-queries.ts');
const checks = [];
const pass = name => { checks.push(name); console.log(`PASS ${name}`); };
async function api(path, { token, body, method = body === undefined ? 'GET' : 'POST', origin = 'https://demo.test' } = {}) {
  const response = await handleDemoRequest(new Request(`https://demo.test/api/mock/v1/${path}`, {
    method, headers: { Origin: origin, ...(token ? { Cookie: `soky_demo_session=${token}` } : {}), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), path);
  return { response, data: await response.json() };
}
async function login(token) {
  const result = await api('auth/login', { token, body: { email: 'admin@soky.test', password: 'demo' } });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  assert.match(result.response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(result.response.headers.get('set-cookie'), /Secure/i);
  return /soky_demo_session=([a-f0-9]{64})/.exec(result.response.headers.get('set-cookie'))[1];
}

assert.equal(state.calls, 0);
assert.equal((await api('products')).response.status, 200);
assert.equal(state.calls, 0);
assert.equal(state.values.size, 0);
pass('Imports and anonymous reads create no datasets or Redis traffic');
const a = await login(), b = await login();
const store1 = new RedisDemoStore(new LuaRedis(), redisDemoConfig().prefix);
const store2 = new RedisDemoStore(new LuaRedis(), redisDemoConfig().prefix);
const sa = await store1.session(a), sb = await store2.session(b);
assert.notEqual(sa.datasetId, sb.datasetId);
const initialA = await withDemoSession(sa, repo.readDemoState);
await withDemoSession(sa, () => repo.mutateDemo(initialA.revision, d => { d.products[0].title = 'Solo visitante A'; }));
const readA = await api('products', { token: a }), readB = await api('products', { token: b });
assert.equal(readA.data.data[0].title, 'Solo visitante A');
assert.notEqual(readB.data.data[0].title, 'Solo visitante A');
pass('Opaque cookies select independent visitor datasets; same-session public API sees admin edits');

const latest = await withDemoSession(sa, repo.readDemoState);
let started = 0, release;
const barrier = new Promise(resolve => { release = resolve; });
const mutate = title => withDemoSession(sa, () => repo.mutateDemo(latest.revision, async d => { started++; if (started === 2) release(); await barrier; d.products[0].title = title; }));
const competing = await Promise.allSettled([mutate('Tab A'), mutate('Tab B')]);
assert.equal(competing.filter(row => row.status === 'fulfilled').length, 1);
assert.equal(competing.find(row => row.status === 'rejected').reason.status, 409);
// Exercise the actual Lua CAS through two separate storage instances too.
const raw = await store1.read(sa), snapshot = JSON.parse(raw);
const next = JSON.stringify({ ...snapshot, revision: snapshot.revision + 1 });
const commits = await Promise.allSettled([store1.commit(sa, raw, next, snapshot.revision), store2.commit(sa, raw, next, snapshot.revision)]);
assert.equal(commits.filter(row => row.status === 'fulfilled').length, 1);
assert.equal(commits.find(row => row.status === 'rejected').reason.status, 409);
pass('Overlapping mutations and independent instances execute Lua revision/save atomically; loser gets 409');

const beforeResetB = await store2.read(sb);
const preResetA = await withDemoSession(sa, repo.readDemoState);
assert.equal((await api('admin/demo/reset', { token: a, body: { confirm: 'CANCEL', expectedRevision: preResetA.revision } })).response.status, 422);
assert.equal((await withDemoSession(sa, repo.readDemoState)).revision, preResetA.revision);
assert.equal((await api('admin/demo/reset', { token: a, body: { confirm: 'RESTORE', expectedRevision: preResetA.revision } })).response.status, 200);
assert.equal(await store2.read(sb), beforeResetB);
pass('Cancel changes nothing; confirmed reset only restores the current visitor');

const afterResetA = await withDemoSession(sa, repo.readDemoState);
await withDemoSession(sa, () => repo.mutateDemo(afterResetA.revision, d => { d.products[0].title = 'Persistente entre instancias'; }));
assert.equal(JSON.parse(await new RedisDemoStore(new LuaRedis(), redisDemoConfig().prefix).read(sa)).products[0].title, 'Persistente entre instancias');
const rotated = await login(a);
assert.equal(await store1.session(a), null);
assert.equal((await store1.session(rotated)).datasetId, sa.datasetId);
assert.equal((await api('products', { token: rotated })).data.data[0].title, 'Persistente entre instancias');
pass('A new storage instance/redeployment retains data; reentry rotates the token and keeps the live copy');

const network = globalThis.fetch;
globalThis.fetch = () => { throw new Error('SSR must not send this cookie to another deployment'); };
try {
  const mine = await cookieContext.run(rotated, () => serverApiGet('/products'));
  const theirs = await cookieContext.run(b, () => serverApiGet('/products'));
  assert.equal(mine.data[0].title, 'Persistente entre instancias');
  assert.notEqual(theirs.data[0].title, 'Persistente entre instancias');
  const catalog = await cookieContext.run(rotated, () => getAllProducts());
  assert.equal(catalog.length, afterResetA.products.filter(row => row.status === 'ACTIVE' && afterResetA.categories.some(c => c.id === row.categoryId && c.isActive)).length);
} finally { globalThis.fetch = network; }
pass('SSR and catalog pagination preserve the validated cookie with zero cross-deployment HTTP requests');

const beforeRate = await api('admin/demo/workspace', { token: rotated });
const manual = await api('admin/exchange-rates/manual', { token: rotated, body: { expectedRevision: beforeRate.data.revision, baseCurrency: 'EUR', rate: '1000.000000', fetchedAt: new Date().toISOString() } });
assert.equal(manual.response.status, 200, JSON.stringify(manual.data));
const quote = await api('cart/quote', { token: rotated, body: { items: [{ productId: 'prod-kiyomi', quantity: 1 }], fulfillmentType: 'PICKUP' } });
assert.equal(quote.response.status, 200, JSON.stringify(quote.data));
const intent = await api('order-intents', { token: rotated, body: {
  items: [{ productId: 'prod-kiyomi', quantity: 1 }], fulfillmentType: 'PICKUP', customerName: 'Nombre real que no se guarda',
  expectedRate: quote.data.rateSnapshot, expectedTotalVes: quote.data.totals.totalVes,
} });
assert.equal(intent.response.status, 201, JSON.stringify(intent.data));
assert.equal(intent.data.whatsappUrl, '');
assert.equal(intent.data.demoPreview, true);
const intentRead = await api(`admin/order-intents/${intent.data.id}`, { token: rotated });
assert.equal(intentRead.response.status, 200);
assert.equal(intentRead.data.customerName, 'Cliente demo');
assert.deepEqual(intentRead.data.rateSnapshot, quote.data.rateSnapshot);
assert.equal((await api(`admin/order-intents/${intent.data.id}`, { token: b })).response.status, 404);
pass('Intents keep their quoted snapshot, anonymize customer data and have no real WhatsApp destination');

const limitSession = await store1.session(rotated);
const beforeLimit = await withDemoSession(limitSession, repo.readDemoState);
await withDemoSession(limitSession, () => repo.mutateDemo(beforeLimit.revision, d => {
  d.orderIntents = Array.from({ length: 100 }, (_, i) => ({ ...d.orderIntents[0], id: `ord-limit-${i}`, publicCode: `LIMIT-${i}` }));
}));
const full = await withDemoSession(limitSession, repo.readDemoState);
await assert.rejects(withDemoSession(limitSession, () => repo.appendDemoIntent(d => d.orderIntents.push({ ...d.orderIntents[0], id: 'one-too-many' }))), error => error.status === 429);
assert.equal((await withDemoSession(limitSession, repo.readDemoState)).revision, full.revision);
pass('Record growth is bounded; a rejected extra intent leaves the stored snapshot unchanged');

const stable = await api('admin/demo/workspace', { token: rotated });
state.fail = true;
const outage = await api('admin/settings', { token: rotated, method: 'PATCH', body: { expectedRevision: stable.data.revision, businessName: 'No debe guardarse' } });
assert.equal(outage.response.status, 503);
assert.equal(outage.data.code, 'STORAGE_ERROR');
assert.doesNotMatch(JSON.stringify(outage.data), /Deliberate|test-credential|upstash.io/);
state.fail = false;
assert.equal((await api('admin/demo/workspace', { token: rotated })).data.revision, stable.data.revision);
pass('Redis failure returns a controlled 503 without leaked secrets, success or file fallback');

for (let i = 0; i < 60; i++) await store1.limit('probe', 'one-copy', 60, 60);
await assert.rejects(store1.limit('probe', 'one-copy', 60, 60), error => error.status === 429);
const bigBody = await api('admin/settings', { token: rotated, method: 'PATCH', body: { text: 'x'.repeat(140000) } });
assert.equal(bigBody.response.status, 413);
assert.equal((await api('admin/settings', { token: rotated, method: 'PATCH', origin: 'https://evil.test', body: {} })).response.status, 403);
pass('The actual Lua rate limiter rejects excess requests; oversized and cross-origin writes are blocked');

const sessionRotated = await store1.session(rotated);
const corruptKey = [...state.values.keys()].find(key => key.endsWith(`:data:${sessionRotated.datasetId}`));
state.values.get(corruptKey).value = '{broken-json';
assert.equal((await api('admin/demo/status', { token: rotated })).data.storageState, 'corrupt');
assert.equal((await api('admin/demo/reset', { token: rotated, body: { confirm: 'RESTORE', expectedRevision: 'RECOVER' } })).response.status, 200);
assert.equal(state.values.get(corruptKey.replace(':data:', ':corrupt:')).value, '{broken-json');
assert.equal(await store2.read(sb), beforeResetB);
pass('Corrupt data requires explicit recovery; one expiring backup preserves the original and other visitors');

assert.equal((await api('auth/logout', { token: rotated, body: {} })).response.status, 200);
assert.equal(await store1.session(rotated), null);
assert.equal((await api('admin/demo/workspace', { token: rotated })).response.status, 401);
state.offset = 8 * 3600000 + 1000;
assert.equal(await store2.session(b), null);
assert.equal((await api('admin/demo/workspace', { token: b })).response.status, 401);
assert.equal((await api('products', { token: b })).response.status, 200);
state.offset = 0;
pass('Logout revokes in Redis; expired sessions/data reject editing and anonymous reads remain available');

const production = redisDemoConfig().prefix;
process.env.VERCEL_ENV = 'preview'; process.env.VERCEL_GIT_COMMIT_REF = 'branch-a';
const previewA = redisDemoConfig().prefix;
process.env.VERCEL_GIT_COMMIT_REF = 'branch-b';
assert.notEqual(redisDemoConfig().prefix, previewA);
assert.notEqual(previewA, production);
delete process.env.VERCEL_GIT_COMMIT_REF;
assert.throws(redisDemoConfig, error => error.code === 'STORAGE_CONFIGURATION');
process.env.SOKY_DEMO_STORAGE = 'file'; process.env.VERCEL = '1';
assert.throws(demoStorageMode, error => error.code === 'STORAGE_CONFIGURATION');
delete process.env.VERCEL; delete process.env.VERCEL_ENV;
pass('Production, previews and branches have distinct server-derived namespaces; Vercel refuses file mode');
assert.ok([...state.values.values()].every(row => row.expiresAt !== null));
console.log(JSON.stringify({ total: checks.length, passed: checks.length, transport: 'local Redis double; production Lua executed in Fengari', realRedisVerified: false }));
