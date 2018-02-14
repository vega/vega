#!/bin/bash

VERSION=$(node -e "var v = require('./package.json').version; process.stdout.write(v.slice(0, v.lastIndexOf('.')))")
FILES=$(find . -name "*.vg.json")

echo "Updating Vega schema version to $VERSION"

for f in $FILES
do
	echo $f
	sed -i '' "s/\"\$schema\": \"https:\/\/vega\.github\.io\/schema\/vega\/v.*\.json\"/\"\$schema\": \"https:\/\/vega.github.io\/schema\/vega\/v$VERSION.json\"/" $f
done
