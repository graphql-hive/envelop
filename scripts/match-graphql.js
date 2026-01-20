const { writeFileSync, readFileSync } = require('fs');
const { resolve } = require('path');
const { argv, cwd } = require('process');

const pkgPath = resolve(cwd(), './package.json');

const pkg = require(pkgPath);

const version = argv[2];

if (pkg.pnpm.overrides.graphql.startsWith(version)) {
  // eslint-disable-next-line no-console
  console.info(`GraphQL v${version} is match! Skipping.`);
  process.exit(0);
}

const npmVersion = version.includes('-') ? version : `^${version}`;
pkg.pnpm.overrides.graphql = npmVersion;
pkg.devDependencies.graphql = npmVersion;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

// fix the graphql-modules plugin because the modules expectes a different signature on the execute
// and this would be a specific issue to graphql-modules and not envelop since we're using a peer graphql
if (version.startsWith('15.')) {
  console.log('Patching graphql-modules plugin for GraphQL v15...');
  const modulesPluginPath = resolve(cwd(), './packages/plugins/graphql-modules/src/index.ts');

  const modulesPluginSource = readFileSync(modulesPluginPath, 'utf8');
  const lines = modulesPluginSource.split('\n');

  lines.splice(11, 0, '// @ts-expect-error only for graphql v15, revert when upgrading to v16');
  lines.splice(19, 0, '// @ts-expect-error only for graphql v15, revert when upgrading to v16');

  writeFileSync(modulesPluginPath, lines.join('\n'), 'utf8');
}
