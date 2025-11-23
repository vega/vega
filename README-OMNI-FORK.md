# Omni Vega Fork

This is a fork of [Vega](https://github.com/vega/vega) that tracks the upstream `vega@6.x` release line while including additional features and modifications needed for Omni's use cases.

## About This Fork

This fork is **ahead** of the upstream Vega repository with the following modifications:

- **OffscreenCanvas Support**: Added comprehensive support for OffscreenCanvas, enabling Vega to run in Web Workers for improved performance
- **Scoped Package Names**: All packages are published under the `@omni-co` npm scope to avoid conflicts with upstream packages

### Package Naming

All packages in this fork use the `@omni-co` scope:

- Upstream: `vega`, `vega-view`, `vega-canvas`, etc.
- This fork: `@omni-co/vega`, `@omni-co/vega-view`, `@omni-co/vega-canvas`, etc.

This allows both upstream and fork packages to coexist in the same project if needed.

## Branch Strategy

### `main` branch
- Kept clean and synchronized with upstream `vega/vega`
- Used for pulling updates from upstream
- **Do not commit custom changes to this branch**

### `release` branch
- Contains all custom modifications and scoped package names
- Used for publishing to npm
- Merges in updates from `main` periodically

### Feature branches
- Create feature branches for new work (e.g., `nate/offscreen-canvas-support`)
- Merge into `release` when ready to publish

## Workflow

### Syncing with Upstream

To pull the latest changes from upstream Vega:

```bash
# Switch to main branch
git checkout main

# Pull latest changes from upstream
git pull upstream main

# Push to our fork's main branch
git push origin main
```

### Merging Upstream Updates into Release

After syncing `main`, merge updates into the `release` branch:

```bash
# Switch to release branch
git checkout release

# Merge main into release
git merge main

# Resolve any conflicts if they occur
# Test the build
npm install
npm run build

# Commit and push
git push origin release
```

### Publishing to npm

1. **Ensure you're logged into npm**:
   ```bash
   npm login
   ```

2. **Verify you have access to @omni-co scope**:
   ```bash
   npm access ls-packages @omni-co
   ```

3. **Publish all packages**:
   ```bash
   git checkout release
   npm run release
   ```

   This runs `lerna publish from-package` which will publish all packages with updated versions.

### Adding New Features

1. **Create a feature branch from `release`**:
   ```bash
   git checkout release
   git checkout -b your-name/feature-name
   ```

2. **Make your changes and test**:
   ```bash
   npm install
   npm run build
   npm test
   ```

3. **Commit and push your feature branch**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin your-name/feature-name
   ```

4. **Merge into `release` when ready**:
   ```bash
   git checkout release
   git merge your-name/feature-name
   git push origin release
   ```

## Using This Fork in Your Projects

Install packages from this fork using the scoped package names:

```bash
npm install @omni-co/vega
npm install @omni-co/vega-view
npm install @omni-co/vega-canvas
# etc.
```

Or in your `package.json`:

```json
{
  "dependencies": {
    "@omni-co/vega": "^6.2.0",
    "@omni-co/vega-view": "^6.1.0"
  }
}
```

## Custom Features

### OffscreenCanvas Support

This fork includes full support for OffscreenCanvas, allowing Vega to render in Web Workers:

```javascript
// In a Web Worker
import { View } from '@omni-co/vega-view';

const view = new View(runtime, { canvas: offscreenCanvas });
view.initialize();
view.run();
```

See `docs/offscreen-canvas-support.md` for detailed documentation.

## Maintenance Notes

- **Version Numbers**: We maintain the same version numbers as upstream for consistency
- **Repository URLs**: All package.json files reference `exploreomni/vega` as the repository
- **Lerna**: This is a Lerna monorepo with independent versioning
- **Build System**: Uses Rollup for bundling

## Questions or Issues?

For issues specific to this fork, please contact the Omni team or file an issue on the [exploreomni/vega](https://github.com/exploreomni/vega) repository.

For general Vega questions, refer to the [upstream Vega documentation](https://vega.github.io/vega/).
