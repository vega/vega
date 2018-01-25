#!/bin/bash

set -e

version=$(npm list vega | head -n 1 | sed 's/.*@//' | awk '{print $1}')

pushd ../schema/vega/

git checkout master
git pull

rm -f v$version.json
cp ../../vega/build/vega-schema.json v$version.json
echo "Copied schema to v$version.json"

prefix=$version
while echo "$prefix" | grep -q '\.'; do
    # stip off everything before . or -
    prefix=$(echo $prefix | sed 's/[\.-][^\.-]*$//')
    ln -f -s v$version.json v$prefix.json
    echo "Symlinked v$prefix.json to v$version.json"
done

if [ -n "$(git status --porcelain)" ]; then
    git add *.json
    git commit -m"Add Vega $version"
    git push
else
  echo "Nothing has changed"
fi

popd
