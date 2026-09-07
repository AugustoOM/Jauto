import { readFileSync } from 'node:fs';

const expected = process.argv[2]?.replace(/^v/, '') ?? JSON.parse(readFileSync('package.json', 'utf8')).version;
const jsonFiles = [
  'package.json',
  'packages/core/package.json', 'packages/file-io/package.json', 'packages/jff/package.json',
  'packages/simulator/package.json', 'packages/ui/package.json',
  'apps/web/package.json', 'apps/desktop/package.json', 'apps/desktop/src-tauri/tauri.conf.json',
];
const mismatches = [];
for (const file of jsonFiles) {
  const version = JSON.parse(readFileSync(file, 'utf8')).version;
  if (version !== expected) mismatches.push(`${file}: ${version ?? 'missing'}`);
}
const cargo = readFileSync('apps/desktop/src-tauri/Cargo.toml', 'utf8');
const cargoVersion = /^version\s*=\s*"([^"]+)"/m.exec(cargo)?.[1];
if (cargoVersion !== expected) mismatches.push(`apps/desktop/src-tauri/Cargo.toml: ${cargoVersion ?? 'missing'}`);
if (mismatches.length) {
  console.error(`Expected every release version to be ${expected}:\n${mismatches.join('\n')}`);
  process.exit(1);
}
console.log(`Release versions agree at ${expected}.`);
