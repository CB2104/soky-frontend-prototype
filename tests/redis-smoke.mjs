// Run manually with a local ignored env file after authorizing the connection test.
// Every write has TTL=60 seconds and a unique test prefix; no visitor data is used.
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { redisDemoConfig } from '../src/mock/demo-config.ts';
import { RedisDemoStore, SESSION_SCRIPT } from '../src/mock/demo-redis.ts';
const config = redisDemoConfig();
const prefix = `${config.prefix}:smoke:${randomBytes(16).toString('hex')}`;
const redis = new Redis({ url: config.url, token: config.token, automaticDeserialization: false, retry: { retries: 0 } });
const token = randomBytes(32).toString('hex'), datasetId = randomBytes(16).toString('hex');
const tokenHash = createHash('sha256').update(token).digest('hex');
const dataKey = `${prefix}:data:${datasetId}`, sessionKey = `${prefix}:session:${tokenHash}`, unusedKey = `${prefix}:session:none`;
const limitKey = `${prefix}:limit-probe:${createHash('sha256').update('smoke').digest('hex')}`;
const record = JSON.stringify({ datasetId, expiresAt: Date.now() + 60000 });
try {
  assert.equal(await redis.eval(SESSION_SCRIPT, [dataKey, sessionKey, unusedKey], [JSON.stringify({ revision: 1, probe: true }), record, 60, '', 'new', '']), 1);
  const one = new RedisDemoStore(redis, prefix), two = new RedisDemoStore(redis, prefix);
  const session = await one.session(token); assert.ok(session);
  const raw = await one.read(session); assert.equal(JSON.parse(raw).revision, 1);
  const next = JSON.stringify({ revision: 2, probe: true });
  const result = await Promise.allSettled([one.commit(session, raw, next, 1), two.commit(session, raw, next, 1)]);
  assert.equal(result.filter(row => row.status === 'fulfilled').length, 1);
  assert.equal(result.find(row => row.status === 'rejected').reason.status, 409);
  assert.equal(JSON.parse(await two.read(session)).revision, 2);
  await one.limit('probe', 'smoke', 1, 60);
  await assert.rejects(two.limit('probe', 'smoke', 1, 60), error => error.status === 429);
  console.log('PASS real Upstash HTTPS, isolated initialization, read/write, concurrent Lua CAS=409 and request limit=429');
} catch {
  console.error('FAIL prueba real de Redis. Revisa la configuración y disponibilidad; no compartas tokens ni el archivo de entorno.');
  process.exitCode = 1;
} finally {
  // Only keys created by this run. TTL also cleans up an interrupted run.
  await Promise.allSettled([dataKey, sessionKey, limitKey].map(key => redis.del(key)));
}
