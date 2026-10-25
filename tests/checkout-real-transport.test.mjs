import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
if (process.env.SOKY_REAL_TRANSPORT_TEST !== '1') {
  execFileSync(process.execPath, ['--import', './tests/demo-loader.mjs', import.meta.filename], { env: { ...process.env, SOKY_REAL_TRANSPORT_TEST: '1', SOKY_DEMO_MODE: 'off', NEXT_PUBLIC_API_MODE: 'real', NEXT_PUBLIC_REAL_API_BASE_URL: 'https://backend.example.test/api/v1' }, stdio: 'inherit', windowsHide: true });
} else {
  const { createOrderIntent, registerWhatsappClicked } = await import('../src/features/checkout/api.ts');
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ id: 'real-backend-result', demoPreview: false }); };
  assert.equal((await createOrderIntent({ items: [], fulfillmentType: 'PICKUP' })).demoPreview, false);
  await registerWhatsappClicked('real-backend-result');
  assert.deepEqual(calls.map(call => call.url), ['https://backend.example.test/api/v1/order-intents', 'https://backend.example.test/api/v1/order-intents/real-backend-result/whatsapp-clicked']);
  assert(calls.every(call => call.options.method === 'POST'));
  console.log('PASS real API transport keeps backend URLs and is unaffected by mock demo off');
}
