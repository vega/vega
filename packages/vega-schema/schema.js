// collect transform definitions from devDependencies
const defs = Object.keys(require('./package.json').devDependencies)
  .reduce((defs, pkg) => {
    const p = require(pkg);
    return defs.concat(
      Object.keys(p).map(_ => p[_].Definition).filter(_ => _)
    );
  }, []);

// import schema generator
const {schema} = require('.');

// generate and output JSON schema
process.stdout.write(JSON.stringify(schema(defs), 0, 2));
