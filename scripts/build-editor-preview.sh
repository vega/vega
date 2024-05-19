#!/usr/bin/env bash

set -eo pipefail

# Build the editor site and replace main build with local copy of vega-lite
echo "Installing Vega"

# echo "Linking vega"
# cd packages/vega
# yarn link
# cd ../..

# Repeat same link process for every package in
# the packages folder
for package in packages/*; do
  if [ -d "$package" ]; then
    cd $package
    yarn link
    cd ../..
  fi
done

yarn lerna run build


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
