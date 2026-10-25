import { execFileSync } from 'node:child_process';
const script = `
  import assert from 'node:assert/strict';
  const { demoEnabled, demoStorageMode, redisDemoConfig } = await import('./src/mock/demo-config.ts');
  const { readDemoState, appendDemoIntent } = await import('./src/mock/demo-repository.ts');
  assert.equal(demoEnabled, false);
  assert.ok((await readDemoState()).products.length);
  await assert.rejects(appendDemoIntent(() => { throw Error('must not run'); }), e => e.code === 'DEMO_DISABLED');
  assert.throws(redisDemoConfig, e => e.code === 'STORAGE_CONFIGURATION');
  process.env.SOKY_DEMO_STORAGE='file'; process.env.VERCEL='1';
  assert.throws(demoStorageMode, e => e.code === 'STORAGE_CONFIGURATION');
`;
for (const mode of [undefined, 'off', 'ON', 'true', '']) {
  const env = { ...process.env };
  for (const name of ['SOKY_DEMO_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'STORAGE_KV_REST_API_URL', 'STORAGE_KV_REST_API_TOKEN', 'VERCEL']) delete env[name];
  if (mode !== undefined) env.SOKY_DEMO_MODE = mode;
  execFileSync(process.execPath, ['--import', './tests/demo-loader.mjs', '--input-type=module', '-e', script], { env, stdio: 'pipe', windowsHide: true });
}
console.log('PASS absent/off/invalid demo flags fail closed; disabled catalog needs no Redis credentials; Vercel refuses file mode');
