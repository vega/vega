#!/usr/bin/env bash

set -eo pipefail

# Build the editor site and replace main build with local copy of vega-lite
echo "Installing Vega"

# Link every package to make sure the editor uses the local version
for package in packages/*; do
  if [ -d "$package" ]; then
    cd $package
    yarn link
    cd ../..
  fi
done

# Build - assumes lerna handles the topological sort
yarn lerna run build

echo "Installing vega editor"
git clone https://github.com/vega/editor.git

cd editor
yarn --frozen-lockfile --ignore-scripts

# HACK: Make sure we prefer the local version to the one from npm
# Test if we can remove this after verifying that only 1 copy of every subpackage is used per repo
for package in ../packages/*; do
  if [ -d "$package" ]; then
    package_name=$(basename $package)
    yarn link $package_name
  fi
done

echo "Creating stub index.json for vega and vega-lite library"

mkdir -p public/spec/vega-lite
mkdir -p public/spec/vega
touch public/spec/vega-lite/index.json
touch public/spec/vega/index.json

cat <<EOF > public/spec/vega-lite/index.json
{}
EOF

cat <<EOF > public/spec/vega/index.json
{}
EOF

# Final site build
yarn run vite build --base /
