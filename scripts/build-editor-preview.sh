#!/usr/bin/env bash

set -eo pipefail

# Build the editor site and replace main build with local copy of vega-lite
echo "Installing Vega"
yarn lerna run build

echo "Linking vega"
cd packages/vega
yarn link
cd ../..

echo "Installing vega editor"
git clone https://github.com/vega/editor.git

cd editor
yarn --frozen-lockfile --ignore-scripts
yarn link vega

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

yarn run vite build --base /
