#!/usr/bin/env node
/**
 * Enforces rules/react-native.md §2: "Every component should have its own
 * folder under src/components and should also be exported from
 * src/components/index.ts."
 *
 * Runs as a `pretest` hook (see package.json) so it fires on every `npm test`
 * invocation — including scoped/filtered runs (`npm test -- src/components/X`)
 * — rather than depending on a session remembering to run it separately.
 *
 * Only checks that a folder has *some* matching export line (`export *` or
 * `export type *`) referencing it — it does not check the barrel's content is
 * otherwise well-formed.
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');
const BARREL_FILE = path.join(COMPONENTS_DIR, 'index.ts');

const folders = fs
    .readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

const barrelContent = fs.readFileSync(BARREL_FILE, 'utf8');

// Matches `export * from './Name'` and `export type * from './Name'` (or "Name/subpath"),
// with or without a trailing semicolon, single or double quotes.
const exportedNames = new Set();
const exportLineRegex = /export\s+(?:type\s+)?\*\s+from\s+['"]\.\/([^'"]+)['"]/g;
let match;
while ((match = exportLineRegex.exec(barrelContent)) !== null) {
    // Only the first path segment matters for this check (e.g. "NavigationBar/types" -> "NavigationBar").
    exportedNames.add(match[1].split('/')[0]);
}

const missing = folders.filter((folder) => !exportedNames.has(folder));

if (missing.length > 0) {
    console.error('\nMissing barrel export(s) in src/components/index.ts (rules/react-native.md §2):\n');
    missing.forEach((folder) => console.error(`  - ${folder}  ->  add: export * from './${folder}'`));
    console.error('\nEvery component folder under src/components must be re-exported from src/components/index.ts.\n');
    process.exit(1);
}

process.exit(0);
