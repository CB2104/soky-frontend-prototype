// TS7 provides Next's native CLI; these lint packages still import the TS6 API.
// Replace only their supported compiler peer with a private, exact dependency.
// pnpm 11.21 does not support the newer `:peer` override selector.
// Remove this bridge when typescript-eslint supports the native compiler API.
const compilerApiConsumers = new Set([
  'typescript-eslint',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@typescript-eslint/typescript-estree',
  '@typescript-eslint/utils',
  '@typescript-eslint/type-utils',
  '@typescript-eslint/project-service',
  '@typescript-eslint/tsconfig-utils',
]);

module.exports = {
  hooks: {
    readPackage(pkg) {
      if (
        !compilerApiConsumers.has(pkg.name) ||
        !pkg.version.startsWith('8.') ||
        pkg.peerDependencies?.typescript !== '>=4.8.4 <6.1.0'
      ) {
        return pkg;
      }

      const peerDependencies = { ...pkg.peerDependencies };
      delete peerDependencies.typescript;

      return {
        ...pkg,
        dependencies: { ...pkg.dependencies, typescript: '6.0.3' },
        peerDependencies,
      };
    },
  },
};
