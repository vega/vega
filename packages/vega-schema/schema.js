import { readFileSync } from 'fs';

// collect transform definitions from devDependencies
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

const defs = [];
for (const pkg in packageJson.devDependencies) {
  const p = await import(pkg);
  defs.push(
    ...Object.keys(p).map(_ => p[_].Definition).filter(_ => _)
  );
}

// import schema generator
import { schema } from './index.js';

// generate and output JSON schema
process.stdout.write(JSON.stringify(schema(defs), 0, 2));
