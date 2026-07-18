#!/usr/bin/env bash

set -eo pipefail

# Build the editor site and replace the NPM copy with local copy of vega
echo "Installing Vega"

# Link every package to make sure the editor uses the local version
for package in packages/*; do
  [ -d "$package" ] && (cd "$package" && npm link)
done

# Build - assumes lerna handles the topological sort
npx lerna run build

echo "Installing vega editor"
git clone https://github.com/vega/editor.git

cd editor
npm ci --ignore-scripts

# Link direct dependencies using npm link (works for top-level deps)
for package in ../packages/*; do
  [ -d "$package" ] && npm link "$(basename "$package")"
done

# Replace nested node_modules copies with symlinks to local packages
# This handles transitive dependencies that npm link doesn't reach
echo "Symlinking nested dependencies to local packages"
node -e "
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagesDir = '../packages';
const localPackages = new Map();

// Build map of local package names to their paths
for (const name of fs.readdirSync(packagesDir)) {
  const pkgPath = path.join(packagesDir, name);
  const pkgJsonPath = path.join(pkgPath, 'package.json');
  if (fs.statSync(pkgPath).isDirectory() && fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    localPackages.set(pkg.name, path.resolve(pkgPath));
  }
}

// Find all nested node_modules that contain our packages and replace with symlinks
function findAndReplace(dir, depth = 0) {
  if (depth > 10) return; // Prevent infinite recursion

  const nodeModules = path.join(dir, 'node_modules');
  if (!fs.existsSync(nodeModules)) return;

  for (const entry of fs.readdirSync(nodeModules)) {
    const entryPath = path.join(nodeModules, entry);

    // Handle scoped packages
    if (entry.startsWith('@') && fs.statSync(entryPath).isDirectory()) {
      for (const scopedEntry of fs.readdirSync(entryPath)) {
        const scopedName = entry + '/' + scopedEntry;
        const scopedPath = path.join(entryPath, scopedEntry);
        if (localPackages.has(scopedName) && !fs.lstatSync(scopedPath).isSymbolicLink()) {
          console.log('  Replacing:', path.relative('.', scopedPath));
          fs.rmSync(scopedPath, { recursive: true });
          fs.symlinkSync(localPackages.get(scopedName), scopedPath);
        }
      }
      continue;
    }

    // Regular packages
    if (localPackages.has(entry) && fs.statSync(entryPath).isDirectory()) {
      if (!fs.lstatSync(entryPath).isSymbolicLink()) {
        console.log('  Replacing:', path.relative('.', entryPath));
        fs.rmSync(entryPath, { recursive: true });
        fs.symlinkSync(localPackages.get(entry), entryPath);
      }
    } else if (fs.statSync(entryPath).isDirectory() && !fs.lstatSync(entryPath).isSymbolicLink()) {
      // Recurse into non-symlinked directories
      findAndReplace(entryPath, depth + 1);
    }
  }
}

findAndReplace('.');
console.log('Done symlinking nested dependencies');
"

echo "Creating stub index.json for vega and vega-lite library"
mkdir -p public/spec/{vega,vega-lite}
echo '{}' > public/spec/vega/index.json
echo '{}' > public/spec/vega-lite/index.json

# Build the editor site in the dist folder
# Build options for disabling sourcemaps/adjusting minification if we go over the 25MB limit on cloudflare
# https://vite.dev/guide/cli.html#options-1
npm run build:only -- --base /
