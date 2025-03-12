import { readFileSync } from 'fs';

// collect transform definitions from devDependencies
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const defs = Object.keys(packageJson.devDependencies)
  .reduce((defs, pkg) => {
    const p = import(pkg);
    return defs.concat(
      Object.keys(p).map(_ => p[_].Definition).filter(_ => _)
    );
  }, []);

// import schema generator
import { schema } from './index.js';

// generate and output JSON schema
process.stdout.write(JSON.stringify(schema(defs), 0, 2));
