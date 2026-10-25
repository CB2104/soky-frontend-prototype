import { spawnSync } from 'node:child_process';
const checks = [
  ['demo-repository.test.mjs', true], ['demo-disabled.test.mjs', false],
  ['catalog-pagination.test.mjs', true], ['demo-reporting.test.mjs', null],
  ['hero-domain.test.mjs', null], ['hero-draft.test.mjs', false],
  ['checkout-real-transport.test.mjs', null], ['manual-rates.cjs', null],
];
for (const [file, mocks] of checks) {
  const args = mocks === null ? [] : [...(mocks ? ['--experimental-test-module-mocks'] : []), '--import', './tests/demo-loader.mjs'];
  const result = spawnSync(process.execPath, [...args, `tests/${file}`], { env: { ...process.env, SOKY_DEMO_STORAGE: 'file', SOKY_DEMO_MODE: 'on' }, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`PASS ${checks.length} existing file-mode regression suites`);
